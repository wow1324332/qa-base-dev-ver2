// api/jira.js
export default async function handler(req, res) {
  // 1. 프론트엔드에서 넘어온 에픽 키(epicKey)를 확인합니다.
  const { epicKey } = req.query;
  if (!epicKey) return res.status(400).json({ error: '에픽 키가 필요합니다.' });

  // 2. 환경 변수에서 JIRA 접속 정보를 가져옵니다.
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const domain = process.env.JIRA_DOMAIN;

  // JIRA 인증용 문자열 (Email:Token 을 Base64로 인코딩)
  const authBuffer = Buffer.from(`${email}:${token}`).toString('base64');

  // 3. JIRA에 보낼 검색어(JQL)를 만듭니다. 
  // "부모가 현재 에픽이고, 이슈 타입이 '개발결함'인 것을 찾아라"
  const jql = `parent = "${epicKey}" AND issuetype = "개발결함" ORDER BY created DESC`;

  try {
    // 4. JIRA 서버에 데이터 요청
    const response = await fetch(`https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authBuffer}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.errorMessages?.[0] || 'JIRA API 오류');

    // 5. 프론트엔드(ProjectsModule)에서 쓰기 좋게 데이터를 예쁘게 가공합니다.
    const formattedIssues = data.issues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      component: issue.fields.components?.[0]?.name || '전체',
      platform: issue.fields.components?.[0]?.name || '전체',
      priority: issue.fields.priority?.name || 'Medium',
      type: issue.fields.issuetype?.name || '개발결함',
      status: issue.fields.status?.name || '진행중',
      reporter: issue.fields.reporter?.displayName || 'Unknown',
      assignee: issue.fields.assignee?.displayName || '미할당',
      date: new Date(issue.fields.created).toLocaleDateString('ko-KR')
    }));

    // 가공된 데이터를 프론트엔드로 전달!
    return res.status(200).json(formattedIssues);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '데이터를 가져오는데 실패했습니다.' });
  }
}
