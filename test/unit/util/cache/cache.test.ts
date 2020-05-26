import test from "ava";
import { Cache, Cacheable } from "../../../../src/util/cache";

class MockCacheableA implements Cacheable {
  id: number;
  expiresIn = 100;
  syncedAt: number;
  testA: string;

  constructor(id: number, testA: string) {
    this.id = id;
    this.testA = testA;
    this.syncedAt = Date.now();
  }
}

class MockCacheableB implements Cacheable {
  id: number;
  expiresIn = 100;
  syncedAt: number;
  testB: number;

  constructor(id: number, testB: number) {
    this.id = id;
    this.testB = testB;
    this.syncedAt = Date.now();
  }
}

let itemsClassA: MockCacheableA[];
let itemsClassB: MockCacheableB[];
let sampleItemsCollection: Map<string, Map<number, Cacheable>>;

test.beforeEach(() => {
  sampleItemsCollection = new Map<string, Map<number, Cacheable>>();
  sampleItemsCollection.set(MockCacheableA.name, new Map<number, Cacheable>());
  sampleItemsCollection.set(MockCacheableB.name, new Map<number, Cacheable>());

  const collectionA: Map<number, Cacheable> = sampleItemsCollection.get(MockCacheableA.name);
  const collectionB: Map<number, Cacheable> = sampleItemsCollection.get(MockCacheableB.name);

  itemsClassA = [new MockCacheableA(0, "obj 1 class A"), new MockCacheableA(1, "obj 2 class A")];

  itemsClassB = [new MockCacheableB(0, 1), new MockCacheableB(1, 100)];

  itemsClassA.forEach((obj: MockCacheableA) => {
    collectionA.set(obj.id, obj);
  });
  itemsClassB.forEach((obj: MockCacheableB) => {
    collectionB.set(obj.id, obj);
  });
});

test("get should return the expected item", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  itemsClassA.forEach((obj: MockCacheableA) => {
    t.deepEqual(cache.get(MockCacheableA.name, obj.id), obj);
  });

  itemsClassB.forEach((obj: MockCacheableB) => {
    t.deepEqual(cache.get(MockCacheableB.name, obj.id), obj);
  });
});

test("get should return undefined when the cache is empty", t => {
  const cache: Cache = new Cache();

  t.is(cache.get(MockCacheableA.name, itemsClassA[0].id), undefined);
});

test("getAll should return the expected items", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  const returnedACollection: MockCacheableA[] = cache.getAll(MockCacheableA.name);
  t.deepEqual(returnedACollection, itemsClassA);

  const returnedBCollection: MockCacheableB[] = cache.getAll(MockCacheableB.name);
  t.deepEqual(returnedBCollection, itemsClassB);
});

test("set should add the given item to the cache", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  itemsClassA.push(new MockCacheableA(2, "test"));
  cache.set(MockCacheableA.name, itemsClassA[itemsClassA.length - 1]);

  t.deepEqual(
    cache.get(MockCacheableA.name, itemsClassA[itemsClassA.length - 1].id),
    itemsClassA[itemsClassA.length - 1]
  );
});

// Serial tests since we are modifying the global itemsClassA
test.serial("set should not affect other collections", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  itemsClassA.push(new MockCacheableA(2, "test"));
  cache.set(MockCacheableA.name, itemsClassA[itemsClassA.length - 1]);

  t.deepEqual(cache.getAll(MockCacheableB.name), itemsClassB);
});

test.serial("set should create new collection in empty cache", t => {
  const cache: Cache = new Cache();

  itemsClassA.push(new MockCacheableA(2, "test"));
  cache.set(MockCacheableA.name, itemsClassA[0]);

  t.deepEqual(cache.get(MockCacheableA.name, itemsClassA[0].id), itemsClassA[0]);
});

test.serial("setAll should add all elements in an array to the cache", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  itemsClassA.push(new MockCacheableA(2, "test"));
  itemsClassA.push(new MockCacheableA(3, "test"));

  cache.setAll(MockCacheableA.name, itemsClassA);

  t.deepEqual(cache.getAll(MockCacheableA.name), itemsClassA);
});

test.serial("getAll should only return elements that are not expired", t => {
  itemsClassA[0].expiresIn = 0;
  const cache: Cache = new Cache(sampleItemsCollection);

  itemsClassA = itemsClassA.splice(1);

  t.deepEqual(cache.getAll(MockCacheableA.name), itemsClassA);
});
// End of serial tests, all other run concurrently

test("setAll should create a new collection in an empty cache", t => {
  const cache: Cache = new Cache();

  cache.setAll(MockCacheableA.name, itemsClassA);

  t.deepEqual(cache.getAll(MockCacheableA.name), itemsClassA);
});

test("setAll should not affect other collections in the cache", t => {
  sampleItemsCollection.delete(MockCacheableA.name);
  const cache: Cache = new Cache(sampleItemsCollection);

  cache.setAll(MockCacheableA.name, itemsClassA);

  t.deepEqual(cache.getAll(MockCacheableB.name), itemsClassB);
});

test("delete should delete the required item from the cache", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  cache.delete(MockCacheableA.name, itemsClassA[0].id);

  // Removing the first element in the array
  itemsClassA = itemsClassA.slice(1);

  t.deepEqual(cache.getAll(MockCacheableA.name), itemsClassA);
  t.deepEqual(cache.getAll(MockCacheableB.name), itemsClassB);
});

test("delete should not throw error when trying to delete an item in a non-existant collection", t => {
  const cache: Cache = new Cache();

  t.is(cache.delete(MockCacheableA.name, itemsClassA[0].id), undefined);
});

test("deleteAll should delete all items in a collection", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  cache.deleteAll(MockCacheableA.name);

  t.deepEqual(cache.getAll(MockCacheableA.name), []);
});

test("deleteAll should only affect one collection", t => {
  const cache: Cache = new Cache(sampleItemsCollection);

  cache.deleteAll(MockCacheableA.name);

  t.deepEqual(cache.getAll(MockCacheableB.name), itemsClassB);
});

test("get should not return expired element", t => {
  const cache: Cache = new Cache();
  const expiredElement: MockCacheableA = new MockCacheableA(0, "test");

  expiredElement.expiresIn = 0;
  cache.set(MockCacheableA.name, expiredElement);

  t.is(cache.get(MockCacheableA.name, expiredElement.id), undefined);
});

test("element with negative expiresIn should not expire", t => {
  const cache: Cache = new Cache();
  const element: MockCacheableA = new MockCacheableA(0, "test");

  element.expiresIn = -1;
  cache.set(MockCacheableA.name, element);

  t.deepEqual(cache.get(MockCacheableA.name, element.id), element);
});
