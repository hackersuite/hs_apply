import test from "ava";
import { when, mock, instance, reset, resetCalls, objectContaining } from "ts-mockito";
import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";

import { ApplicantService, ReviewService } from "../../../src/services";
import { ReviewRepository } from "../../../src/repositories";
import { Repository } from "typeorm";
import { Applicant, Review } from "../../../src/models/db";

const testApplicant: Applicant = new Applicant();
testApplicant.id = "7479a451-e968-4271-8073-729ddcf522ee";
testApplicant.age = 18;
testApplicant.gender = "Male";
testApplicant.nationality = "British";
testApplicant.country = "UK";
testApplicant.city = "Manchester";
testApplicant.university = "University of Manchester";
testApplicant.degree = "CS";
testApplicant.yearOfStudy = "1";
testApplicant.workArea = "";
testApplicant.skills = "";
testApplicant.hackathonCount = 0;
testApplicant.whyChooseHacker = "";
testApplicant.pastProjects = "";
testApplicant.hardwareRequests = "";
testApplicant.dietaryRequirements = "Halal";
testApplicant.tShirtSize = "M";
testApplicant.hearAbout = "IDK";

const testReview: Review = new Review();
testReview.applicant = new Applicant();
testReview.averageScore = 1.0;
testReview.createdAt = new Date(Date.now());
testReview.createdByAuthID = "1010";
testReview.id = "1a1a1a1";

let mockApplicantService: ApplicantService;
let reviewService: ReviewService;
let mockReviewRepository: Repository<Review>;
class StubReviewRepository extends Repository<Review> {}

test.before(() => {
  const stubReviewRepository: ReviewRepository = mock(ReviewRepository);
  mockReviewRepository = mock(StubReviewRepository);
  when(stubReviewRepository.getRepository()).thenReturn(instance(mockReviewRepository));
  container.rebind(TYPES.ReviewRepository).toConstantValue(instance(stubReviewRepository));

  mockApplicantService = mock(ApplicantService);
  container.rebind(TYPES.ApplicantService).toConstantValue(instance(mockApplicantService));
});

test.beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
  reviewService = container.get(TYPES.ReviewService);
});

test.afterEach(() => {
  // Restore to last snapshot so each unit test takes a clean copy of the container
  container.restore();
  resetCalls(mockReviewRepository);
  reset(mockReviewRepository);
});

/**
 * getAll Tests
 */
test("Test all reviews can be found", async t => {
  // Set up the stubbed method in the mock
  when(mockReviewRepository.find(undefined)).thenResolve([testReview]);

  // Perform the test by calling the method in the service
  const result: Review[] = await reviewService.getAll();

  // Check the result is expected
  t.deepEqual(result[0], testReview);
});

test("Test only selected columns returned in getAll", async t => {
  const testReviewOnlyAvgScore: Review = new Review();
  testReviewOnlyAvgScore.averageScore = 10.0;
  // Set up the stubbed method in the mock
  when(mockReviewRepository.find(objectContaining({ select: ["averageScore"] }))).thenResolve([testReviewOnlyAvgScore]);

  // Perform the test by calling the method in the service
  const result: Review[] = await reviewService.getAll(["averageScore"]);

  // Check the result is expected
  t.deepEqual(result[0], testReviewOnlyAvgScore);
});

test("Test error thrown when getAll fails", async t => {
  // Set up the stubbed method in the mock
  when(mockReviewRepository.find(objectContaining({ select: ["createdAt"] }))).thenThrow(new Error());

  const error: Error = await t.throwsAsync(reviewService.getAll(["createdAt"]));

  t.truthy(error);
});

/**
 * getNextApplication Tests
 */
test("Test that an application returned with less than 2 reviews", async t => {
  const testReviewerID = "101001";
  when(mockApplicantService.getKRandomToReview).thenReturn(() => Promise.resolve([testApplicant]));

  // Although the getNextApplication has a random component, it is deterministic if we only pick from 1 application
  // TODO: Switch to using SinonJS for testing so we can stub the Math.random function
  const application: Applicant = await reviewService.getNextApplication(testReviewerID, 1);

  t.deepEqual(application, testApplicant);
});

test("Test that undefined is returned when no application are for review", async t => {
  const testReviewerID = "10100101";
  when(mockApplicantService.getKRandomToReview).thenReturn(() => Promise.resolve([]));

  const application: Applicant = await reviewService.getNextApplication(testReviewerID, 1);

  t.is(application, undefined);
});
