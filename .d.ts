
/**
 * Gives an object that can be used to build the project
 * @param path Path to the project src
 */
export function build(path: string): {
    /**
     * Sets the dist and builds the project
     * @param dist Dist path
     */
    to(dist: string): void;
};