export const EVENT_SOURCES = {
  GITEE: 'https://gitee.com',
  EUR: 'https://eur.openeuler.openatom.cn',
};

export const eventSourceNames: Record<string, string> = {
  [EVENT_SOURCES.EUR]: 'EUR消息',
  [EVENT_SOURCES.GITEE]: 'Gitee消息',
};

export const eventTypeNames: Record<string, Record<string, string>> = {
  [EVENT_SOURCES.EUR]: {
    build: 'EUR消息',
  },
  [EVENT_SOURCES.GITEE]: {
    issue: 'Issue',
    pr: 'Pull Request',
    push: 'Push',
    note: '评论',
  },
};

export const eurBuildStatus = [
  { label: 'failed', value: 0 },
  { label: 'succeeded', value: 1 },
  { label: 'canceled', value: 2 },
  { label: 'running', value: 3 },
  { label: 'pending', value: 4 },
  { label: 'skipped', value: 5 },
  { label: 'starting', value: 6 },
  { label: 'importing', value: 7 },
  { label: 'forked', value: 8 },
  { label: 'waiting', value: 9 },
  { label: 'unknown', value: 1000 },
];
