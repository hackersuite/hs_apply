import { setupTestEnvironment, initEnv, updateEnv } from '../../util';
setupTestEnvironment();
import { setupCommonMocks } from '../../util/mocks';
setupCommonMocks();

// We use jest to mock out axios requests since we sometimes call the dropbox api
import axios from 'axios';
jest.mock('axios');

import { when, mock, instance, verify, anything, objectContaining, reset, resetCalls } from 'ts-mockito';
import { InjectedRepository } from '../../../src/repositories';
import { Repository, DeleteResult } from 'typeorm';
import { Applicant } from '../../../src/models/db';
import { ApplicantService } from '../../../src/services';

import container from '../../../src/inversify.config';

const axiosMock = axios as jest.Mocked<typeof axios>;
const successResponse = 'Success';

const testApplicantMale: Applicant = new Applicant();
testApplicantMale.id = '7479a451-e968-4271-8073-729ddcf522ee';
testApplicantMale.age = 18;
testApplicantMale.gender = 'Male';
testApplicantMale.nationality = 'British';
testApplicantMale.country = 'UK';
testApplicantMale.city = 'Manchester';
testApplicantMale.university = 'University of Manchester';
testApplicantMale.degree = 'CS';
testApplicantMale.yearOfStudy = '1';
testApplicantMale.workArea = '';
testApplicantMale.skills = '';
testApplicantMale.hackathonCount = 0;
testApplicantMale.whyChooseHacker = '';
testApplicantMale.pastProjects = '';
testApplicantMale.hardwareRequests = '';
testApplicantMale.dietaryRequirements = 'Halal';
testApplicantMale.tShirtSize = 'M';
testApplicantMale.hearAbout = 'IDK';
testApplicantMale.cv = '123';

const testApplicantFemale: Applicant = new Applicant();
testApplicantFemale.id = '7479a451-e826-4271-8073-929ccef522ee';
testApplicantFemale.age = 19;
testApplicantFemale.gender = 'Female';
testApplicantFemale.nationality = 'British';
testApplicantFemale.country = 'UK';
testApplicantFemale.city = 'Manchester';
testApplicantFemale.university = 'University of Manchester';
testApplicantFemale.degree = 'CS';
testApplicantFemale.yearOfStudy = '1';
testApplicantFemale.hackathonCount = 0;
testApplicantFemale.dietaryRequirements = 'Halal';
testApplicantFemale.tShirtSize = 'M';
testApplicantFemale.hearAbout = 'IDK';

const testApplicantInvalid: Applicant = new Applicant();
testApplicantInvalid.id = '7479a451-e826-4271-8073-929ccef522ee';
testApplicantInvalid.age = -1;
testApplicantInvalid.gender = 'Female';
testApplicantInvalid.nationality = 'British';
testApplicantInvalid.country = 'UK';
testApplicantInvalid.city = 'Manchester';
testApplicantInvalid.university = 'University of Manchester';
testApplicantInvalid.yearOfStudy = '1';
testApplicantInvalid.hackathonCount = 0;
testApplicantInvalid.dietaryRequirements = 'Halal';
testApplicantInvalid.tShirtSize = 'M';
testApplicantInvalid.hearAbout = 'IDK';

let applicantService: ApplicantService;
let mockApplicantRepository: Repository<Applicant>;
class StubApplicationRepository extends Repository<Applicant> {}

beforeAll(() => {
	const stubRepository: InjectedRepository<Applicant> = mock(InjectedRepository);
	mockApplicantRepository = mock(StubApplicationRepository);
	when(stubRepository.getRepository(Applicant)).thenReturn(instance(mockApplicantRepository));
	container.rebind(InjectedRepository).toConstantValue(instance(stubRepository));

	// Mock the POST Axios request for the cloud service requests
	axiosMock.post.mockResolvedValue({ data: successResponse });
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
	applicantService = container.get(ApplicantService);
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the application container
	container.restore();
	resetCalls(mockApplicantRepository);
	reset(mockApplicantRepository);

	// Clear the axios mock to reset calls for cloud service requests
	axiosMock.post.mockClear();
});

test('Test all applicants can be found', async () => {
	// Set up the stubbed method in the mock
	when(mockApplicantRepository.find(undefined)).thenResolve([testApplicantMale]);

	// Perform the test by calling the method in the service
	const result: Applicant[] = await applicantService.getAll();

	// Check the result is expected
	expect(result[0]).toEqual(testApplicantMale);
	verify(mockApplicantRepository.find(undefined)).called();
});

test('Test all applicants can be found with specific columns', async () => {
	// Set up the stubbed method in the mock
	const testPartialApplicant = new Applicant();
	testPartialApplicant.age = 18;
	testPartialApplicant.gender = 'Male';
	when(mockApplicantRepository.find(objectContaining({ select: ['gender'] }))).thenResolve([testPartialApplicant]);

	// Perform the test by calling the method in the service
	const result: Applicant[] = await applicantService.getAll(['gender']);

	// Check the result is expected
	expect(result[0]).toEqual(testPartialApplicant);
	verify(mockApplicantRepository.find(objectContaining({ select: ['gender'] }))).called();
});

test('Test error thrown when getAll fails', async () => {
	// Set up the stubbed method in the mock
	when(mockApplicantRepository.find(undefined)).thenReject(new Error());

	// Perform the test by calling the method in the service
	await expect(applicantService.getAll()).rejects.toThrow();

	// Check the result is expected
	verify(mockApplicantRepository.find(undefined)).called();
});

test('Test a single applicant can be found', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.findOne(objectContaining({ id: testApplicantFemale.id }))).thenResolve(
		testApplicantFemale
	);

	// Perform the test by calling the method in the service
	const result: Applicant = await applicantService.findOne(testApplicantFemale.id);

	// Check the result is expected
	expect(result).toEqual(testApplicantFemale);
	verify(mockApplicantRepository.findOne(objectContaining({ id: testApplicantFemale.id }))).called();
});

test('Test error thrown when id not provided to findOne()', async () => {
	// Perform the test by calling the method in the service
	await expect(applicantService.findOne(undefined)).rejects.toThrow();

	// Check the result is expected
	verify(mockApplicantRepository.findOne(undefined)).never();
});

test('Test error thrown when applicant not found', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.findOne(objectContaining({ id: testApplicantMale.id }))).thenReject(new Error());

	// Perform the test by calling the method in the service
	await expect(applicantService.findOne(testApplicantMale.id)).rejects.toThrow();

	// Check the result is expected
	verify(mockApplicantRepository.findOne(objectContaining({ id: testApplicantMale.id }))).once();
});

test('Test a single valid applicant can be created', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.save(testApplicantFemale)).thenResolve(testApplicantFemale);

	// Perform the test by calling the method in the service
	const result: Applicant = await applicantService.save(testApplicantFemale);

	// Check the result is expected
	expect(result).toEqual(testApplicantFemale);
	verify(mockApplicantRepository.save(testApplicantFemale)).once();
});

test('Test that error thrown when save fails', async () => {
	// Simulate an error occuring in the database which causes an error to be thrown
	when(mockApplicantRepository.save(testApplicantMale)).thenReject(new Error());

	await expect(applicantService.save(testApplicantMale)).rejects.toThrow();
	// Check the error actually is defined
	verify(mockApplicantRepository.save(testApplicantMale)).once();
});

test('Test that error thrown when applicant invalid', async () => {
	// Try and create the applicant and check for error
	await expect(applicantService.save(testApplicantInvalid)).rejects.toThrow();

	// Check the error actually is defined
	verify(mockApplicantRepository.save(testApplicantInvalid)).never();
});

test('Test that error thrown when API keys not set-up for file upload', async () => {
	// Disable the Dropbox API token
	updateEnv({ DROPBOX_API_TOKEN: '' });

	// We also need to fetch the new version of the applicant service so the cloud service is re-injected
	// with the new DROPBOX_API_TOKEN
	applicantService = container.get(ApplicantService);

	// Try and create the applicant and check for error
	await expect(applicantService.save(testApplicantMale, Buffer.from(''))).rejects.toThrow();

	// Check the error actually is defined
	verify(mockApplicantRepository.save(testApplicantInvalid)).never();

	// Reload the original env config
	initEnv();
});

test('Test that error thrown when delete is rejected', async () => {
	const testID = '0';
	when(mockApplicantRepository.findOne(anything())).thenResolve(undefined);
	when(mockApplicantRepository.delete(testID)).thenReject(new Error());

	await expect(applicantService.delete(testID)).rejects.toThrow();

	// Check the delete function was called in the mock
	verify(mockApplicantRepository.delete(testID)).once();
});

test('Test that applicant can be removed by using the id', async () => {
	when(mockApplicantRepository.findOne(testApplicantMale.id)).thenResolve(testApplicantFemale);
	when(mockApplicantRepository.delete(testApplicantMale.id)).thenResolve(new DeleteResult());

	await expect(applicantService.delete(testApplicantMale.id)).resolves.toBeInstanceOf(DeleteResult);

	// Check the delete function was called in the mock
	verify(mockApplicantRepository.delete(objectContaining(testApplicantMale.id))).once();
});

test('Test that all applications and count selected with ascesnding order by date', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.findAndCount(anything())).thenResolve([[testApplicantMale, testApplicantFemale], 2]);

	// Call the function in the applicant service
	const result: [Partial<Applicant>[], number] = await applicantService.getAllAndCountSelection(
		['gender'],
		'age',
		'ASC'
	);

	// Check that the results are as expected
	const allFoundApplicants: Partial<Applicant>[] = result[0];
	const numberOfApplicants: number = result[1];
	expect(allFoundApplicants[0].gender).toBe(testApplicantMale.gender);
	expect(allFoundApplicants[1].gender).toBe(testApplicantFemale.gender);
	expect(numberOfApplicants).toBe(2);
	verify(mockApplicantRepository.findAndCount(anything())).once();
});

test('Test that all applications and count selected with no ordering', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.findAndCount(anything())).thenResolve([[testApplicantMale, testApplicantFemale], 2]);

	// Call the function in the applicant service
	const result: [Partial<Applicant>[], number] = await applicantService.getAllAndCountSelection(['id', 'gender']);

	// Check that the results are as expected
	const allFoundApplicants: Partial<Applicant>[] = result[0];
	const numberOfApplicants: number = result[1];
	expect(allFoundApplicants[0].id).toBe(testApplicantMale.id);
	expect(allFoundApplicants[0].gender).toBe(testApplicantMale.gender);

	expect(allFoundApplicants[1].id).toBe(testApplicantFemale.id);
	expect(allFoundApplicants[1].gender).toBe(testApplicantFemale.gender);
	expect(numberOfApplicants).toBe(2);
	verify(mockApplicantRepository.findAndCount(anything())).called();
});

test('Test that error thrown when getting applicants and count fails', async () => {
	// Set up the stubbed methods in the mock
	when(mockApplicantRepository.findAndCount(anything())).thenThrow(new Error());

	// Call the function in the applicant service
	await expect(applicantService.getAllAndCountSelection(['id'])).rejects.toThrow();

	verify(mockApplicantRepository.findAndCount(anything())).once();
});
