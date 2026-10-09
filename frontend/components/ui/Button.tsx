type ButtonProps = {
    text: string;
  };
  
  export default function Button({ text }: ButtonProps) {
    return (
      <button className="bg-brand px-6 py-3 rounded-xl text-[var(--on-primary)] hover:bg-brand-hover transition-all">
        {text}
      </button>
    );
  }