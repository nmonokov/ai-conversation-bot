/**
 * To be sure we have necessary properties set here is a check
 * with an error thrown if property is missing. Also, it is possible to have a default value.
 *
 * @param name environment variable name
 * @param defaultValue optional
 */
export const property = (name: string, defaultValue?: any): any => {
  const environmentVariable = process.env[name];
  if (!environmentVariable && !defaultValue) {
    throw Error(`Environment variable ${name} is not set.`);
  }
  return environmentVariable || defaultValue;
};
