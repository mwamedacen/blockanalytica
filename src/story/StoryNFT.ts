import { SPGNFTContractAddress, client } from './utils/utils.ts'
import { uploadJSONToIPFS } from './utils/uploadToIpfs.ts'
import { createHash } from 'crypto'
import { Address, toHex } from 'viem'
import { mintNFT } from './utils/mintNFT.ts'
import { NFTContractAddress, NonCommercialSocialRemixingTermsId, account } from './utils/utils.ts'


export async function mintAndRegisterIpAndMakeDerivative() {

    const childIp = await client.ipAsset.mintAndRegisterIpAndMakeDerivative({
        spgNftContract: SPGNFTContractAddress,
        allowDuplicates: true,
        derivData: {
            parentIpIds: ["0xaF8ce70dB5FEb32d6Ff61F050DfB16A7F77D940c" as Address],
            licenseTermsIds: [1],
            maxMintingFee: 0,
            maxRts: 100_000_000,
            maxRevenueShare: 100,
        },
        // NOTE: The below metadata is not configured properly. It is just to make things simple.
        // See `simpleMintAndRegister.ts` for a proper example.
        ipMetadata: {
            ipMetadataURI: 'https://ipfs.io/ipfs/bafkreicj54w4hijl7q2nw33qat4h2muxsbgskrtwv4ghpjbsmsmi5iu2ce',
            nftMetadataURI: 'https://ipfs.io/ipfs/bafkreicj54w4hijl7q2nw33qat4h2muxsbgskrtwv4ghpjbsmsmi5iu2ce',
        },
        txOptions: { waitForTransaction: true },
    })
    console.log(`Derivative IPA created and linked at transaction hash ${childIp.txHash}, IPA ID: ${childIp.ipId}}`)
};  

export async function mintStoryIP() {
    // 1. Set up your IP Metadata
    //
    // Docs: https://docs.story.foundation/docs/ipa-metadata-standard
    const ipMetadata = {
        title: 'DeFiAI.RelateWallets',
        description: 'This is a response for the DeFiAI.RelateWallets about a wallet.',
        createdAt: new Date().getTime().toString(),
        creators: [
            {
                name: 'DeFiAI',
                address: '0xD9268c264AA6bF7115794C83dfb3490F3EAB5844',
                contributionPercent: 100,
            },
        ],
        image: 'https://pub-5a5ea1506f3d410d86e9fc33172c13a4.r2.dev/download.png',
        mediaUrl: 'https://pub-5a5ea1506f3d410d86e9fc33172c13a4.r2.dev/download.png'
    }

    // 2. Set up your NFT Metadata
    //
    // Docs: https://docs.opensea.io/docs/metadata-standards#metadata-structure
    const nftMetadata = {
        name: 'DeFiAI.RelateWallets',
        description: 'This is a response for the DeFiAI.RelateWallets about a wallet.',
        image: 'https://pub-5a5ea1506f3d410d86e9fc33172c13a4.r2.dev/download.png',
        media: [
            {
                name: 'DeFiAI.RelateWallets',
                url: 'https://pub-5a5ea1506f3d410d86e9fc33172c13a4.r2.dev/download.png',
                mimeType: 'image/png',
            },
        ],
        attributes: [
            {
                key: 'Artist',
                value: 'DeFiAI',
            },
        ],
    }

    // 3. Upload your IP and NFT Metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata)
    const ipHash = createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata)
    const nftHash = createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')

    // 4. Register the NFT as an IP Asset
    //
    // Docs: https://docs.story.foundation/docs/sdk-ipasset#mintandregisterip
    const response = await client.ipAsset.mintAndRegisterIp({
        spgNftContract: SPGNFTContractAddress,
        allowDuplicates: true,
        ipMetadata: {
            ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
            ipMetadataHash: `0x${ipHash}`,
            nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
            nftMetadataHash: `0x${nftHash}`,
        },
        txOptions: { waitForTransaction: true },
    })
    console.log(`Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`)
    console.log(`View on the explorer: https://aeneid.explorer.story.foundation/ipa/${response.ipId}`)

    return response.txHash !== undefined
}
