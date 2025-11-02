export const shortenAddress = (address: string, maxLength: number = 12) => {
    if (!address) return "";
    
    
    if (address.length <= maxLength) {
      return address;
    }
    
    
    const last = address.slice(-maxLength);
    return `...${last}`;
  };