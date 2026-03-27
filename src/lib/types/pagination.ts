export type CursorPageResult<T> = {
    items: T[];
    pageSize: number;
    nextCursor: string;
    hasNextPage: boolean;
};
