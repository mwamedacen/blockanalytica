import { SPGNFTContractAddress, client } from './utils/utils'
import { uploadJSONToIPFS } from './utils/uploadToIpfs'
import { createHash } from 'crypto'

export async function mintStoryNFT() {
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
