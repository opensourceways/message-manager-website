export const EventSources = {
  EUR: 'https://eur.openeuler.openatom.cn',
  GITEE: 'https://gitee.com',
};

export const EventSourceNames: Record<string, string> = {
  [EventSources.EUR]: 'EUR',
  [EventSources.GITEE]: 'Gitee',
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

export const REPO_PROJ_NAME_PATTERN = /^\*$|^[a-zA-Z1-9]+\/(?:\*{1}|[a-zA-Z1-9]+)/;