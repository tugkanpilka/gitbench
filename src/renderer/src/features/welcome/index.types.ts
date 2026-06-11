export type TProps = {
  loading: boolean;
  error: string | null;
  onOpenRepository: () => void | Promise<void>;
};
