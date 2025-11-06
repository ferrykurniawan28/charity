// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./mockIDRX.sol";

/**
 * @title CharityPlatform
 * @dev Transparent charity platform with ERC-20 token donations
 */
contract CharityPlatform {
    // ============ STATE VARIABLES ============
    IDRXToken public token;
    address public owner;
    uint256 public campaignCounter;
    uint256 public totalDonations;
    
    // ============ STRUCTS ============
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string imageHash; // IPFS hash for transparency
        uint256 targetAmount;
        uint256 raisedAmount;
        address beneficiary;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool fundsReleased;
        uint256 donorCount;
    }
    
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }
    
    // ============ MAPPINGS ============
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;
    mapping(uint256 => mapping(address => uint256)) public donorContributions;
    mapping(uint256 => address[]) public campaignDonors;
    
    // ============ EVENTS ============
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 targetAmount,
        uint256 endTime
    );
    
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount,
        string message
    );
    
    event FundsReleased(
        uint256 indexed campaignId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event CampaignStatusChanged(
        uint256 indexed campaignId, 
        bool isActive
    );
    
    event CampaignExtended(
        uint256 indexed campaignId,
        uint256 newEndTime
    );

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyCampaignCreator(uint256 _campaignId) {
        require(campaigns[_campaignId].creator == msg.sender, "Not campaign creator");
        _;
    }
    
    modifier campaignExists(uint256 _campaignId) {
        require(_campaignId > 0 && _campaignId <= campaignCounter, "Campaign does not exist");
        _;
    }
    
    modifier campaignActive(uint256 _campaignId) {
        require(campaigns[_campaignId].isActive, "Campaign not active");
        require(block.timestamp <= campaigns[_campaignId].endTime, "Campaign has ended");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = IDRXToken(_tokenAddress);
        campaignCounter = 0;
        totalDonations = 0;
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Create a new charity campaign
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageHash,
        uint256 _targetAmount,
        address _beneficiary,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be positive");
        require(_beneficiary != address(0), "Invalid beneficiary address");
        require(_durationInDays > 0 && _durationInDays <= 365, "Duration must be between 1-365 days");

        campaignCounter++;
        uint256 endTime = block.timestamp + (_durationInDays * 1 days);

        campaigns[campaignCounter] = Campaign({
            id: campaignCounter,
            creator: msg.sender,
            title: _title,
            description: _description,
            imageHash: _imageHash,
            targetAmount: _targetAmount,
            raisedAmount: 0,
            beneficiary: _beneficiary,
            startTime: block.timestamp,
            endTime: endTime,
            isActive: true,
            fundsReleased: false,
            donorCount: 0
        });

        emit CampaignCreated(campaignCounter, msg.sender, _title, _targetAmount, endTime);
        return campaignCounter;
    }

    /**
     * @dev Donate to a campaign using IDRX tokens
     */
    function donate(
        uint256 _campaignId,
        uint256 _amount,
        string memory _message
    ) external campaignExists(_campaignId) campaignActive(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(_amount > 0, "Donation amount must be positive");
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");

        // Transfer tokens from donor to this contract
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        // Update campaign stats
        campaign.raisedAmount += _amount;
        totalDonations += _amount;

        // Record donation if it's the first donation from this address
        if (donorContributions[_campaignId][msg.sender] == 0) {
            campaign.donorCount++;
            campaignDonors[_campaignId].push(msg.sender);
        }
        
        donorContributions[_campaignId][msg.sender] += _amount;

        // Record donation history
        campaignDonations[_campaignId].push(Donation({
            donor: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            message: _message
        }));

        emit DonationReceived(_campaignId, msg.sender, _amount, _message);
    }

    /**
     * @dev Release funds to beneficiary (creator or owner can call)
     */
    function releaseFunds(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(
            msg.sender == campaign.creator || msg.sender == owner,
            "Not authorized to release funds"
        );
        require(campaign.raisedAmount > 0, "No funds to release");
        require(!campaign.fundsReleased, "Funds already released");
        require(block.timestamp > campaign.endTime, "Campaign not ended yet");

        campaign.fundsReleased = true;
        campaign.isActive = false;

        // Transfer raised tokens to beneficiary
        require(
            token.transfer(campaign.beneficiary, campaign.raisedAmount),
            "Token transfer to beneficiary failed"
        );

        emit FundsReleased(_campaignId, campaign.beneficiary, campaign.raisedAmount);
    }

    /**
     * @dev Extend campaign duration (only creator)
     */
    function extendCampaign(uint256 _campaignId, uint256 _additionalDays) 
        external 
        campaignExists(_campaignId)
        onlyCampaignCreator(_campaignId)
    {
        Campaign storage campaign = campaigns[_campaignId];
        require(_additionalDays > 0 && _additionalDays <= 30, "Can extend by 1-30 days");
        
        campaign.endTime += (_additionalDays * 1 days);
        
        emit CampaignExtended(_campaignId, campaign.endTime);
    }

    /**
     * @dev Toggle campaign active status (creator or owner)
     */
    function toggleCampaignStatus(uint256 _campaignId) 
        external 
        campaignExists(_campaignId) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(
            msg.sender == campaign.creator || msg.sender == owner,
            "Not authorized"
        );
        
        campaign.isActive = !campaign.isActive;
        emit CampaignStatusChanged(_campaignId, campaign.isActive);
    }

    /**
     * @dev Emergency withdraw donations if campaign fails (only owner)
     */
    function emergencyWithdraw(uint256 _campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.raisedAmount > 0, "No funds to withdraw");
        require(!campaign.fundsReleased, "Funds already released");
        
        campaign.fundsReleased = true;
        campaign.isActive = false;

        // Return funds to owner for safekeeping (could implement refund logic later)
        require(
            token.transfer(owner, campaign.raisedAmount),
            "Token transfer failed"
        );
    }

    // ============ VIEW FUNCTIONS ============

    function getCampaign(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Campaign memory) 
    {
        return campaigns[_campaignId];
    }

    function getCampaignDonations(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (Donation[] memory) 
    {
        return campaignDonations[_campaignId];
    }

    function getCampaignDonors(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (address[] memory) 
    {
        return campaignDonors[_campaignId];
    }

    function getDonorContribution(uint256 _campaignId, address _donor) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (uint256) 
    {
        return donorContributions[_campaignId][_donor];
    }

    function getCampaignCount() external view returns (uint256) {
        return campaignCounter;
    }

    function isCampaignActive(uint256 _campaignId) external view returns (bool) {
        Campaign memory campaign = campaigns[_campaignId];
        return campaign.isActive && block.timestamp <= campaign.endTime && !campaign.fundsReleased;
    }

    function getCampaignProgress(uint256 _campaignId) 
        external 
        view 
        campaignExists(_campaignId) 
        returns (uint256 percentage) 
    {
        Campaign memory campaign = campaigns[_campaignId];
        if (campaign.targetAmount == 0) return 0;
        
        percentage = (campaign.raisedAmount * 100) / campaign.targetAmount;
        if (percentage > 100) percentage = 100;
    }

    function getPlatformStats() external view returns (
        uint256 totalCampaigns,
        uint256 totalRaised,
        uint256 activeCampaigns
    ) {
        totalCampaigns = campaignCounter;
        totalRaised = totalDonations;
        
        activeCampaigns = 0;
        for (uint256 i = 1; i <= campaignCounter; i++) {
            if (this.isCampaignActive(i)) {
                activeCampaigns++;
            }
        }
    }
}