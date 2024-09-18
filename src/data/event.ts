export const EventSources = {
  EUR: 'https://eur.openeuler.openatom.cn',
  MEETING: 'https://www.openEuler.org/meeting',
  GITEE: 'https://gitee.com',
  CVE: 'cve',
};

export const EventSourceNames: Record<string, string> = {
  [EventSources.EUR]: 'EUR消息',
  [EventSources.GITEE]: 'Gitee消息',
  [EventSources.MEETING]: '会议通知',
  [EventSources.CVE]: '漏洞消息',
};

export const EventSourceTypes = {
  [EventSources.EUR]: ['build'],
  [EventSources.GITEE]: ['issue', 'pr', 'push', 'note'],
  [EventSources.MEETING]: [],
  [EventSources.CVE]: ['issue'],
};

export const EventTypeNames: Record<string, Record<string, string>> = {
  [EventSources.EUR]: {
    build: '构建状态',
  },
  [EventSources.GITEE]: {
    issue: 'Issue',
    pr: 'Pull Request',
    push: 'Push',
    note: '评论',
  },
};

export const EUR_BUILD_STATUS = [
  { label: 'importing', value: 7 },
  { label: 'pending', value: 4 },
  { label: 'starting', value: 6 },
  { label: 'running', value: 3 },
  { label: 'succeeded', value: 1 },
  { label: 'forked', value: 8 },
  { label: 'skipped', value: 5 },
  { label: 'failed', value: 0 },
  { label: 'canceled', value: 2 },
  { label: 'waiting', value: 9 },
  { label: 'unknown', value: 1000 },
];

export const REPO_PROJ_NAME_PATTERN = /^\*$|^.+\/(?:\*{1}|.+)/;

export const EmptyTip = {
  [EventSources.EUR]: '您创建的项目或您发起的构建项目的状态更新会显示在这里',
  [EventSources.GITEE]: '您关注的Gitee仓库中Issue、PR和评论时间更新会显示在这里',
  [EventSources.MEETING]: '您管理的SIG组会议的通知显示在这里',
  [EventSources.CVE]: '您关注的Gitee仓库中漏洞信息的更新会显示在这里',
}