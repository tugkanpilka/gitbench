export type WelcomeScreenProps = {
  loading: boolean;
  error: string | null;
  onOpenRepository: () => void | Promise<void>;
};
