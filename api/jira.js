export default async function handler(req, res) {
  const { epicKey } = req.query;
  
  if (!epicKey) {
    return res.status(400).json({ error: '에픽 키가 필요합니다.' });
  }

  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  const domain = process.env.JIRA_DOMAIN;

  // JIRA 인증용 Base64 인코딩
  const authBuffer = Buffer.from(`${email}:${token}`).toString('base64');
  
  // JQL 검색어 세팅
  const jql = `parent = "${epicKey}" AND issuetype = "개발결함" ORDER BY created DESC`;

  try {
    // Vercel 에러 로그(CHANGE-2046) 권고사항에 맞춰 GET -> POST 및 최신 엔드포인트로 변경
    const response = await fetch(`https://${domain}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authBuffer}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 100,
        fields: [
          "summary", "components", "priority", "issuetype", 
          "status", "reporter", "assignee", "created"
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessages?.[0] || 'JIRA API 서버 통신 에러');
    }

    // 프론트엔드 UI에 맞게 데이터 정제
    const formattedIssues = (data.issues || []).map(issue => ({
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
