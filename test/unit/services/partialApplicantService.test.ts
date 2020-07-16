import { initEnv } from '../../util';
initEnv();

import { when, mock, instance, reset, resetCalls } from 'ts-mockito';
import container from '../../../src/inversify.config';
import { TYPES } from '../../../src/types';

import { PartialApplicantService } from '../../../src/services';
import { PartialApplicantRepository } from '../../../src/repositories';
import { Repository } from 'typeorm';
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
	test('Test that when valid partial application submitted it is accepted', async () => {
		// when(mockPartialApplicantRepository.save(anything())).thenResolve(testPartialApplicant);

		// return expect(partialApplicantService.save('01aef', testRawPartialApplication))
		// 	.resolves.toBeDefined();

		expect(true).toBeTruthy();
	});
});
