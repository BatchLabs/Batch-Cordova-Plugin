/* eslint-disable @typescript-eslint/no-explicit-any */
import { User as UserAction } from "../src/actions";

const expectations = {
  identifier: "username",
  installationID: "cac0efba-6430-427a-a764-55100a2a89a6",
  language: "fr",
  region: "FR",
};

let mockedUserGettersShouldReturnUndefined = false;

export async function mockedSendToBridgePromise(
  method: string,
  args: unknown[] | null
): Promise<undefined | string> {
  return new Promise((resolve) => {
    mockedSendToBridge(
      (result) => {
        resolve(result);
      },
      method as any,
      args as any
    );
  });
}

function mockedSendToBridge(
  callback: ((result?: string) => void) | null,
  method: UserAction,
  args: any[]
) {
  const arg = (args || [])[0];

 if (method === UserAction.GetIdentifier) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.identifier);
    }
  } else if (method === UserAction.GetInstallationID) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.installationID);
    }
  } else if (method === UserAction.GetLanguage) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.language);
    }
  } else if (method === UserAction.GetRegion) {
    if (mockedUserGettersShouldReturnUndefined) {
      callback?.(undefined);
    } else {
      callback?.(expectations.region);
    }
  }
}

jest.doMock("../src/helpers", () => {
  const helpers = jest.requireActual("../src/helpers");
  // tslint:disable-next-line:only-arrow-functions
  return {
    ...helpers,
    sendToBridge: jest.fn(mockedSendToBridge),
    sendToBridgePromise: jest.fn(mockedSendToBridgePromise),
  };
});

import { UserModule } from "../src/modules/user";

test("it can read back the installation ID", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getInstallationID()).toBe(
    expectations.installationID
  );

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getInstallationID()).toBeUndefined();
});

test("it can read back the Custom ID", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getIdentifier()).toBe(expectations.identifier);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getIdentifier()).toBeUndefined();
});

test("it can read back the custom language", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getLanguage()).toBe(expectations.language);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getLanguage()).toBeUndefined();
});

test("it can read back the custom region", async () => {
  const userModule = new UserModule();

  mockedUserGettersShouldReturnUndefined = false;

  expect(await userModule.getRegion()).toBe(expectations.region);

  mockedUserGettersShouldReturnUndefined = true;

  expect(await userModule.getRegion()).toBeUndefined();
});
