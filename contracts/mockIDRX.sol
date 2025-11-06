// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title IDRXToken
 * @dev Full ERC-20 implementation dengan approval system untuk charity platform
 */
contract IDRXToken {
    // ============ METADATA ============
    string public name;
    string public symbol;
    uint8 public decimals;

    // ============ STATE ============
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;

    // ============ EVENTS ============
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ============ CONSTRUCTOR ============
    constructor() {
        name = "Mock IDRX Token";
        symbol = "IDRX";
        decimals = 18;
        
        uint256 initialSupply = 1000000 * 10**uint256(decimals);
        _mint(msg.sender, initialSupply);
    }

    // ============ VIEW FUNCTIONS ============
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    // ============ TRANSFER FUNCTIONS ============
    function transfer(address to, uint256 value) public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        _spendAllowance(from, msg.sender, value);
        _transfer(from, to, value);
        return true;
    }

    // ============ APPROVAL FUNCTIONS ============
    function approve(address spender, uint256 value) public returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        uint256 currentAllowance = _allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(msg.sender, spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    // ============ INTERNAL FUNCTIONS ============
    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= value, "ERC20: transfer amount exceeds balance");
        
        unchecked {
            _balances[from] = fromBalance - value;
            _balances[to] += value;
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += value;
        unchecked {
            _balances[account] += value;
        }
        emit Transfer(address(0), account, value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal {
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - value);
            }
        }
    }

    // ============ ADDITIONAL FEATURES FOR CHARITY ============
    
    /**
     * @dev Mint new tokens - only for testing/development
     * In production, you might want to restrict this to owner
     */
    function mint(address to, uint256 value) external {
        // In production, add access control:
        // require(msg.sender == owner, "Only owner can mint");
        _mint(to, value);
    }

    /**
     * @dev Batch transfer for airdrops or bulk donations
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata values) external returns (bool) {
        require(recipients.length == values.length, "IDRX: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], values[i]);
        }
        return true;
    }
}