export interface Config {
  port: number;
}

export default (): Config => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
  };
};
