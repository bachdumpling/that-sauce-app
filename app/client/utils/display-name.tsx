export function getDisplayName(creator: {
    first_name?: string | null;
    last_name?: string | null;
    username: string;
  }) {
    const fn = creator.first_name?.trim();
    const ln = creator.last_name?.trim();
    if (fn && ln) {
      return `${fn} ${ln}`;
    }
    return creator.username;
  }