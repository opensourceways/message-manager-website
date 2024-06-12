import { isNull, isUndefined } from '@opensig/opendesign';
import { useTitle, type MaybeRef } from '@vueuse/core';

export const useMetaTitle = (title?: MaybeRef<string | null | undefined>) => {
  const defaultTitle = 'message-manager';
  if (isNull(title) || isUndefined(title)) {
    return useTitle(defaultTitle);
  }
  return useTitle(title, { titleTemplate: `%s | ${defaultTitle}` });
};
