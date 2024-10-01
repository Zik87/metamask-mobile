import {
  SubjectMetadataController,
  SubjectType,
} from '@metamask/permission-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import {
  isProtocolAllowed,
  keyringSnapPermissionsBuilder,
} from './keyringSnapsPermissions';

const PORTFOLIO_ORIGINS: string[] = [
  'https://portfolio.metamask.io',
  'https://dev.portfolio.metamask.io',
  'https://ramps-dev.portfolio.metamask.io',
];

describe('keyringSnapPermissionsBuilder', () => {
  const mockController = new SubjectMetadataController({
    subjectCacheLimit: 100,
    messenger: {
      registerActionHandler: jest.fn(),
      registerInitialEventPayload: jest.fn(),
      publish: jest.fn(),
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    state: {},
  });
  mockController.addSubjectMetadata({
    origin: 'https://some-dapp.com',
    subjectType: SubjectType.Website,
  });

  describe('Portfolio origin', () => {
    it.each(PORTFOLIO_ORIGINS)(
      'returns the methods that can be called by %s',
      (origin: string) => {
        const permissions = keyringSnapPermissionsBuilder(origin);
        expect(permissions()).toStrictEqual([
          KeyringRpcMethod.ListAccounts,
          KeyringRpcMethod.GetAccount,
          KeyringRpcMethod.GetAccountBalances,
          KeyringRpcMethod.SubmitRequest,
        ]);
      },
    );
    it.each(PORTFOLIO_ORIGINS)(
      '%s cannot create an account',
      (origin: string) => {
        const permissions = keyringSnapPermissionsBuilder(origin);
        expect(permissions()).not.toContain(KeyringRpcMethod.CreateAccount);
      },
    );
    it.each(PORTFOLIO_ORIGINS)('%s can submit a request', (origin: string) => {
      const permissions = keyringSnapPermissionsBuilder(origin);
      expect(permissions()).toContain(KeyringRpcMethod.SubmitRequest);
    });
  });

  it('returns the methods metamask can call', () => {
    const permissions = keyringSnapPermissionsBuilder('metamask');
    expect(permissions()).toStrictEqual([
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.SubmitRequest,
      KeyringRpcMethod.RejectRequest,
    ]);
  });

  it('returns the methods a known origin can call', () => {
    const permissions = keyringSnapPermissionsBuilder('https://some-dapp.com');
    expect(permissions()).toStrictEqual([
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ExportAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,
    ]);
  });

  it('returns the methods an unknown origin can call', () => {
    const permissions = keyringSnapPermissionsBuilder(
      'https://some-other-dapp.com',
    );
    expect(permissions()).toStrictEqual([
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ExportAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,
    ]);
  });

  it.each([
    '',
    'null',
    'sftp://some-dapp.com',
    'http://some-dapp.com',
    '0',
    undefined,
    null,
    true,
    false,
    1,
    0,
    -1,
  ])('"%s" cannot call any methods', (origin: unknown) => {
    const permissions = keyringSnapPermissionsBuilder(
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      origin as any,
    );
    expect(permissions()).toStrictEqual([]);
  });
});

describe('isProtocolAllowed', () => {
  it.each([
    ['http://some-dapp.com', false],
    ['https://some-dapp.com', true],
    ['sftp://some-dapp.com', false],
    ['', false],
    ['null', false],
    ['0', false],
    [undefined, false],
    [null, false],
    [true, false],
    [false, false],
    [1, false],
    [0, false],
    [-1, false],
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])('"%s" cannot call any methods', (origin: any, expected: boolean) => {
    expect(isProtocolAllowed(origin)).toBe(expected);
  });
});