type PageTitleProps = {
  title: string;
};

export default function PageTitle({ title: pageTitle }: PageTitleProps) {
  return <title>{pageTitle}</title>;
}
