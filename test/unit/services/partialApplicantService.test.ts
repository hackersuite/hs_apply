import { initEnv } from '../../util';
initEnv();

import { when, mock, instance, reset, resetCalls, anything } from 'ts-mockito';
import container from '../../../src/inversify.config';
import { TYPES } from '../../../src/types';

import { PartialApplicantService } from '../../../src/services';
import { PartialApplicantRepository } from '../../../src/repositories';
import { Repository, DeleteResult } from 'typeorm';
import { PartialApplicant } from '../../../src/models/db';

const testPartialApplicant: PartialApplicant = new PartialApplicant();
testPartialApplicant.authId = '7479a451e929ccef522ee';
testPartialApplicant.lastModified = new Date();
testPartialApplicant.partialApplication = {};

const testRawPartialApplication: Record<string, string> = {
	age: '20',
	gender: 'female',
	city: 'Manchester'
};

let partialApplicantService: PartialApplicantService;
let mockPartialApplicantRepository: Repository<PartialApplicant>;
class StubPartialApplicationRepository extends Repository<PartialApplicant> {}

beforeAll(() => {
	// Mock out the partial applicant repository
	const stubPartialApplicantRepository: PartialApplicantRepository = mock(PartialApplicantRepository);
	mockPartialApplicantRepository = mock(StubPartialApplicationRepository);
	when(stubPartialApplicantRepository.getRepository()).thenReturn(instance(mockPartialApplicantRepository));
	container.rebind(TYPES.PartialApplicantRepository).toConstantValue(instance(stubPartialApplicantRepository));
});

beforeEach(() => {
	// Create a snapshot so each unit test can modify it without breaking other unit tests
	container.snapshot();
	partialApplicantService = container.get(TYPES.PartialApplicantService);
});

afterEach(() => {
	// Restore to last snapshot so each unit test takes a clean copy of the application container
	container.restore();
	resetCalls(mockPartialApplicantRepository);
	reset(mockPartialApplicantRepository);
});

describe('Partial application submisssion', () => {
	test('Test when valid partial application submitted it is accepted', async () => {
		when(mockPartialApplicantRepository.save(anything())).thenResolve(testPartialApplicant);
		return expect(partialApplicantService.save('01aef', testRawPartialApplication)).resolves.toBe(testPartialApplicant);
	});

	test('Test when valid partial application submitted, and save fails, error thrown', async () => {
		when(mockPartialApplicantRepository.save(anything())).thenReject(new Error());
		return expect(partialApplicantService.save('01aef', testRawPartialApplication)).rejects.toBeInstanceOf(Error);
	});
});

describe('Partial application find', () => {
	test('Test when valid application ID submitted it returns applicant', async () => {
		when(mockPartialApplicantRepository.findOne(anything())).thenResolve(testPartialApplicant);
		return expect(partialApplicantService.find('01aef')).resolves.toBe(testPartialApplicant);
	});

	test('Test when invalid application ID submitted it throws error', async () => {
		when(mockPartialApplicantRepository.findOne(anything())).thenResolve(undefined);
		return expect(partialApplicantService.find('')).rejects.toThrowError('Applicant does not exist');
	});

	test('Test when DB error occurs error is thrown', async () => {
		when(mockPartialApplicantRepository.findOne(anything())).thenThrow(new Error());
		return expect(partialApplicantService.find('01aef')).rejects.toThrow();
	});
});

describe('Partial application remove', () => {
	test('Test when valid application ID submitted it successfully deletes entry', async () => {
		when(mockPartialApplicantRepository.delete(anything())).thenResolve(new DeleteResult());
		return expect(partialApplicantService.remove('01aef')).resolves.toBeInstanceOf(DeleteResult);
	});

	test('Test when invalid application ID submitted it throws error', async () => {
		when(mockPartialApplicantRepository.delete(anything())).thenThrow(new Error());
		return expect(partialApplicantService.remove('01aef')).rejects.toThrow();
	});
});
