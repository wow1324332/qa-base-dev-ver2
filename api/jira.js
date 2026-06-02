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
        fields: ["summary", "components", "priority", "issuetype", "status", "reporter", "assignee", "created", "customfield_10694", "description", "customfield_99999"]
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

    const formattedIssues = allIssues.map(issue => {
      let phenom = '-';
      const rawPhenom = issue.fields?.customfield_10694;
      if (rawPhenom) {
        phenom = rawPhenom.value || rawPhenom;
        if (typeof phenom !== 'string') phenom = String(phenom);
      }

      let desc = '설명 내용이 없습니다.';
      if (issue.fields?.description) {
        if (typeof issue.fields.description === 'string') {
          desc = issue.fields.description;
        } else if (issue.fields.description.content) {
          try {
            desc = issue.fields.description.content.map(block => {
              if (block.content) return block.content.map(inline => inline.text || '').join('');
              return '';
            }).join('\n');
          } catch(e) {
            desc = '설명 형식을 변환할 수 없습니다.';
          }
        }
      }

      // [추가] 타입2 전용 커스텀 필드 "이슈 내용" 추출 (customfield_99999는 실제 ID로 변경 필요)
      let contentStr = '이슈 내용이 없습니다.';
      if (issue.fields?.customfield_10655) {
        if (typeof issue.fields.customfield_10655 === 'string') {
          contentStr = issue.fields.customfield_10655;
        } else if (issue.fields.customfield_10655.content) {
          try {
            contentStr = issue.fields.customfield_10655.content.map(block => {
              if (block.content) return block.content.map(inline => inline.text || '').join('');
              return '';
            }).join('\n');
          } catch(e) {
            contentStr = '이슈 내용 형식을 변환할 수 없습니다.';
          }
        } else {
          contentStr = String(issue.fields.customfield_10655);
        }
      }

      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields?.summary || '제목 없음',
        description: desc || '설명 내용이 없습니다.',
        issueContent: contentStr || '이슈 내용이 없습니다.',
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
