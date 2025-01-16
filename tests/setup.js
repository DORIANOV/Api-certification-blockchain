require('dotenv').config({ path: '.env.test' });

// Mock pour ethers.js
jest.mock('ethers', () => ({
    providers: {
        JsonRpcProvider: jest.fn().mockImplementation(() => ({
            getNetwork: jest.fn().mockResolvedValue({ chainId: 80001 })
        }))
    },
    Contract: jest.fn().mockImplementation(() => ({
        registerWork: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                events: [{
                    event: 'WorkRegistered',
                    args: { tokenId: '1' }
                }]
            })
        }),
        distributeRoyalties: jest.fn().mockResolvedValue({
            wait: jest.fn().mockResolvedValue({
                events: [{
                    event: 'RoyaltyDistributed',
                    args: {
                        recipient: '0x1234...',
                        amount: '1000000000000000000'
                    }
                }]
            })
        })
    })),
    Wallet: jest.fn().mockImplementation(() => ({
        connect: jest.fn()
    })),
    utils: {
        parseEther: jest.fn().mockReturnValue('1000000000000000000'),
        formatEther: jest.fn().mockReturnValue('1.0')
    }
}));
