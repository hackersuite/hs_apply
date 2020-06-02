import container from "../../../src/inversify.config";
import { TYPES } from "../../../src/types";
import { initEnv } from "../../util";
import { CloudStorageService } from "../../../src/services";
import axios from "axios";
import { createWriteStream as writeStreamFunc } from "fs";
import { PassThrough } from "stream";
import { logger } from "../../../src/util";

let storageService: CloudStorageService;

beforeAll(() => {
  initEnv();
});

beforeEach(() => {
  // Create a snapshot so each unit test can modify it without breaking other unit tests
  container.snapshot();
  storageService = container.get(TYPES.CloudStorageService);
});

afterEach(() => {
  // Restore to last snapshot so each unit test takes a clean copy of the container
  container.restore();
});

jest.mock("axios");
describe("API request to dropbox", () => {
  const axiosMock = axios as jest.Mocked<typeof axios>;
  const successResponse = "Success";
  beforeAll(() => {
    axiosMock.post.mockResolvedValue({ data: successResponse });
  });

  afterEach(() => {
    axiosMock.post.mockClear();
  });

  test("Test upload should return success with valid file buffer", async () => {
    const result = await storageService.upload("testfile.pdf", Buffer.from(""));

    expect(axiosMock.post).toBeCalledTimes(1);
    expect(result).toBe(successResponse);
  });

  test("Test delete should return success with valid filename", async () => {
    const result = await storageService.delete("testfile.pdf");

    expect(axiosMock.post).toBeCalledTimes(1);
    expect(result).toBe(successResponse);
  });

  jest.mock("fs");
  const mockCreateWriteStreamFunction = writeStreamFunc as jest.Mock;
  test.skip("Test downloadAll should return success with write stream", async () => {
    const mockStream = new PassThrough();
    mockCreateWriteStreamFunction.mockImplementation(() => mockStream);
    const mockWriteStream = mockCreateWriteStreamFunction("temp.pdf");

    const result = await storageService.downloadAll(mockWriteStream);

    expect(axiosMock.post).toBeCalledTimes(1);
    expect(result).toBe(successResponse);
  });
});
