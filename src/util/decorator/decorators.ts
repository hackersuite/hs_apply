export interface ApplicationMappingOptions {
  /**
   * Specifies if the property is optional in the application
   */
  isOptional?: boolean;

  /**
   * Specifies if the property has an "Other" option in the application form
   */
  hasOther?: boolean;

  /**
   * Specifies if the property is to be casted into a number
   */
  isNumeric?: boolean;

  /**
   * When provided, indicates that the question is to be included in the review
   */
  reviewed?: ReviewApplicationOptions;
}

/**
 * Defines the possible groups a review question can be placed into
 */
export type ReviewGroups = "Enthusiasm" | "Technical" | "Non-Technical";
export interface ReviewApplicationOptions {
  /**
   * Specifies the review group the question is placed under
   */
  group?: ReviewGroups;

  /**
   * Specifies if the question is separately scored rather than in a combined group
   */
  isSeparateScore?: boolean;
}

export const applicationMapping: Map<string, ApplicationMappingOptions> = new Map();
export const reviewApplicationMapping: Map<string, string[]> = new Map();
/**
 * Maps the applicant property to the application in a post request
 *
 * Include the properties that are found in the POST request
 */
export function ApplicationMapped(options?: ApplicationMappingOptions) {
  return function(object: Record<string, any>, propertyName: string): void {
    if (options && options.reviewed) {
      // Add mapping for all the properties that are to be included in the review
      const groupKey = options.reviewed.group || (options.reviewed.isSeparateScore && "individual") || undefined;
      if (groupKey === undefined) return;

      const currentGroupArray = reviewApplicationMapping.get(groupKey);
      if (currentGroupArray === undefined) {
        reviewApplicationMapping.set(groupKey, [propertyName]);
      } else {
        currentGroupArray.push(propertyName);
        reviewApplicationMapping.set(groupKey, currentGroupArray);
      }
    }
    applicationMapping.set(propertyName, options);
  };
}
