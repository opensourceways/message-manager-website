export const eventSourceNames: Record<string, string> = {
  'https://eur.openeuler.openatom.cn': 'EUR消息',
  'https://gitee.com': 'Gitee消息',
};

export const eventTypeNames: Record<string, Record<string, string>> = {
  'https://eur.openeuler.openatom.cn': {
    build: 'EUR消息',
  },
  'https://gitee.com': {
    default: 'Gitee消息',
    issue: 'Issue消息',
    pr: 'Pull Request消息',
    push: 'Push消息',
    note: '评论消息',
  },
};

export const events = [
  { source: 'https://eur.openeuler.openatom.cn', event_type: 'build' },
  {
    source: 'https://gitee.com',
    children: [
      { source: 'https://gitee.com', event_type: 'issue' },
      { source: 'https://gitee.com', event_type: 'pr' },
      { source: 'https://gitee.com', event_type: 'push' },
      { source: 'https://gitee.com', event_type: 'note' },
    ],
  },
];

export const EVENT_SOURCES = {
  GITEE: 'https://gitee.com',
  EUR: 'https://eur.openeuler.openatom.cn',
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
