type ButtonProps = {
    text: string;
  };
  
  export default function Button({ text }: ButtonProps) {
    return (
      <button className="bg-orange-500 px-6 py-3 rounded-xl hover:bg-orange-600 transition-all">
        {text}
      </button>
    );
  }