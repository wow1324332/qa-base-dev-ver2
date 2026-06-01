export default async function handler(req, res) {
  const { epicKey } = req.query;
  
  if (!epicKey) {
    return res.status(400).json({ error: '에픽 키가 필요합니다.' });
  }

  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  let domain = process.env.JIRA_DOMAIN;

  if (domain) {
    domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const authBuffer = Buffer.from(`${email}:${token}`).toString('base64');
  
  try {
    // [1단계 탐색] 에픽에 속한 중간 징검다리 작업(Task 등)을 모두 찾습니다.
    const parentJql = `parent = "${epicKey}" OR "Epic Link" = "${epicKey}"`;
    const parentResponse = await fetch(`https://${domain}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authBuffer}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql: parentJql, maxResults: 1000, fields: ["id", "key"] })
    });

    const parentData = await parentResponse.json();
    if (!parentResponse.ok) throw new Error(parentData.errorMessages?.[0] || '1단계 JIRA API 에러');

    const parentKeys = (parentData.issues || []).map(issue => issue.key);
    const searchKeys = [epicKey, ...parentKeys];

    // [수정 핵심] JQL 문법 오류 방지
    // 배열 안의 키값(EPIC-1204 등)을 큰따옴표(" ")로 감싸서 문자열로 만들어줍니다.
    const searchKeysString = searchKeys.map(k => `"${k}"`).join(',');

    // [2단계 탐색] 찾아낸 모든 부모(Task 및 에픽)에 속한 "개발결함"을 찾습니다.
    const jql = `parent in (${searchKeysString}) AND issuetype = "개발결함" ORDER BY created DESC`;
    
    // [100개 제한 돌파] 페이징(Pagination) 처리 추가
    let allIssues = [];
    let startAt = 0;
    let isLast = false;

    while (!isLast) {
      const response = await fetch(`https://${domain}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authBuffer}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jql: jql,
          maxResults: 100, // API 1회 최대 호출 제한 (100개씩 나눠서 호출)
          startAt: startAt, // 몇 번째부터 가져올지 지정
          fields: ["summary", "components", "priority", "issuetype", "status", "reporter", "assignee", "created"]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.errorMessages?.[0] || '2단계 JIRA API 에러');

      // 새로 가져온 데이터를 기존 배열에 누적
      allIssues = allIssues.concat(data.issues || []);
      
      // 모두 가져왔는지 확인 (현재까지 가져온 수 >= JIRA 전체 수)
      if (startAt + (data.issues || []).length >= data.total) {
        isLast = true;
      } else {
        startAt += 100; // 다음 100개 가져오기 위해 카운트 증가
      }
    }

    // 프론트엔드 UI에 맞게 300+개 전체 데이터 정제
    const formattedIssues = allIssues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields?.summary || '제목 없음',
      component: issue.fields?.components?.[0]?.name || '전체',
      platform: issue.fields?.components?.[0]?.name || '전체',
      priority: issue.fields?.priority?.name || 'Medium',
      type: issue.fields?.issuetype?.name || '개발결함',
      status: issue.fields?.status?.name || '진행중',
      reporter: issue.fields?.reporter?.displayName || 'Unknown',
      assignee: issue.fields?.assignee?.displayName || '미할당',
      date: new Date(issue.fields?.created).toLocaleDateString('ko-KR')
    }));

    return res.status(200).json(formattedIssues);

  } catch (error) {
    console.error("JIRA Fetch Error:", error);
    return res.status(500).json({ error: error.message || '데이터를 가져오는데 실패했습니다.' });
  }
}
