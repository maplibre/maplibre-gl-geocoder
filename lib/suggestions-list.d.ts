declare module "suggestions-list" {
    export type TypeaheadOptions = {
        filter: boolean;
        minLength: number;
        limit: number;
        noInitialSelection: boolean;
    };

    class Typeahead<TItem> {
        data: TItem[];
        selected: TItem;
        options: TypeaheadOptions;
        query: string;
        constructor(input: HTMLInputElement, data: TItem[], options?: TypeaheadOptions);
        update(data: TItem[]): void;
        select(): void;
        clear(): void;
        getItemValue(item: TItem): string;
        renderError(error: string): void;
        render(item: TItem): string;
    }
    export default Typeahead;
}