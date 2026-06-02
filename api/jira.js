export default async function handler(req, res) {
  // [수정] 프론트엔드에서 넘어온 issueType을 받습니다. (기본값: 개발결함)
  const { epicKey, issueType } = req.query;
  const targetIssueType = issueType || '개발결함';
  
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
    const parentJql = `parent = "${epicKey}" OR "Epic Link" = "${epicKey}"`;
    let parentKeys = [];
    let parentNextPageToken = null;
    let isParentLast = false;

    while (!isParentLast) {
      const parentPayload = {
        jql: parentJql,
        maxResults: 100,
        fields: ["id", "key"]
      };
      
      if (parentNextPageToken) {
        parentPayload.nextPageToken = parentNextPageToken;
      }

      const parentResponse = await fetch(`https://${domain}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authBuffer}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(parentPayload)
      });

      const parentData = await parentResponse.json();
      if (!parentResponse.ok) throw new Error(parentData.errorMessages?.[0] || '1단계 JIRA API 에러');

      parentKeys = parentKeys.concat((parentData.issues || []).map(issue => issue.key));

      if (parentData.nextPageToken) {
        parentNextPageToken = parentData.nextPageToken;
      } else {
        isParentLast = true;
      }
    }

    const searchKeys = [epicKey, ...parentKeys];
    const searchKeysString = searchKeys.map(k => `"${k}"`).join(',');
    
    // [수정] 하드코딩된 '개발결함' 대신 선택된 스페이스의 targetIssueType을 넣습니다.
    const jql = `parent in (${searchKeysString}) AND issuetype = "${targetIssueType}" ORDER BY created DESC`;
    
    let allIssues = [];
    let nextPageToken = null;
    let isLast = false;

    while (!isLast) {
      const payload = {
        jql: jql,
        maxResults: 100, 
        // [수정] 커스텀 필드 번호 10655로 정확히 변경
        fields: ["summary", "components", "priority", "issuetype", "status", "reporter", "assignee", "created", "customfield_10694", "description", "customfield_10655"]
      };
      
      if (nextPageToken) payload.nextPageToken = nextPageToken; 

      const response = await fetch(`https://${domain}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authBuffer}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.errorMessages?.[0] || '2단계 JIRA API 에러');

      allIssues = allIssues.concat(data.issues || []);
      
      if (data.nextPageToken) {
        nextPageToken = data.nextPageToken;
      } else {
        isLast = true; 
      }
    }

    // [수정] JIRA ADF 뿐만 아니라 단순 텍스트, 객체(value), 배열 등 모든 데이터 형태를 에러 없이 파싱하는 만능 함수로 업그레이드
    const extractTextFromADF = (field) => {
      if (field === null || field === undefined) return '';
      if (typeof field === 'string') return field;
      if (typeof field === 'number') return String(field);

      if (field.type === 'doc' || Array.isArray(field.content)) {
        const parseNode = (node) => {
          if (!node) return '';
          if (typeof node === 'string') return node;
          if (node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            const isBlock = ['paragraph', 'listItem', 'heading'].includes(node.type);
            const childText = node.content.map(parseNode).join('');
            return isBlock ? childText + '\n' : childText;
          }
          return '';
        };
        return parseNode(field);
      }

      // 커스텀 필드가 { value: "..." } 형태의 객체인 경우 처리
      if (field.value !== undefined) return String(field.value);
      
      // 다중 선택 필드 등의 배열인 경우 처리
      if (Array.isArray(field)) return field.map(f => extractTextFromADF(f)).join(', ');

      // 알 수 없는 객체일 경우 내용이라도 볼 수 있도록 JSON 문자열 변환
      try {
        return JSON.stringify(field);
      } catch (e) {
        return '';
      }
    };

    const formattedIssues = allIssues.map(issue => {
      let phenom = '-';
      const rawPhenom = issue.fields?.customfield_10694;
      if (rawPhenom) {
        phenom = rawPhenom.value || rawPhenom;
        if (typeof phenom !== 'string') phenom = String(phenom);
      }

      // [수정] 업그레이드된 만능 추출 함수를 적용하여 이슈 내용을 완벽하게 파싱
      let desc = extractTextFromADF(issue.fields?.description)?.trim() || '설명 내용이 없습니다.';
      let contentStr = extractTextFromADF(issue.fields?.customfield_10655)?.trim() || '이슈 내용이 없습니다.';

      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary || '제목 없음',
        description: desc,
        issueContent: contentStr,
        component: issue.fields?.components?.[0]?.name || '전체',
        platform: issue.fields?.components?.[0]?.name || '전체',
        priority: issue.fields?.priority?.name || 'Medium',
        type: issue.fields?.issuetype?.name || targetIssueType,
        phenomenon: phenom,
        status: issue.fields?.status?.name || '진행중',
        reporter: issue.fields?.reporter?.displayName || 'Unknown',
        assignee: issue.fields?.assignee?.displayName || '미할당',
        date: new Date(issue.fields?.created).toLocaleDateString('ko-KR')
      };
    });

    return res.status(200).json({ issues: formattedIssues, domain: domain });

  } catch (error) {
    console.error("JIRA Fetch Error:", error);
    return res.status(500).json({ error: error.message || '데이터를 가져오는데 실패했습니다.' });
  }
}
