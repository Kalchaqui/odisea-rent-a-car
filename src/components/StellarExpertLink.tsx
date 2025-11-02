function StellarExpertLink({ url }: { url: string }) {
    return (
      <div className="flex justify-center mt-8">
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-purple-400 underline transition-colors neon-text-blue"
        >
          View on explorer
        </a>
      </div>
    );
  }
  
  export default StellarExpertLink;