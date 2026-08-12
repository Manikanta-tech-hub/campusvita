type Props = {
    title: string;
  };
  
  export default function SidebarSection({ title }: Props) {
    return (
      <div className="px-4 pt-6 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {title}
        </p>
      </div>
    );
  }