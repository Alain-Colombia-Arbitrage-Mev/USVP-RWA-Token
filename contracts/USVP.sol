// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Blocklist} from "./Blocklist.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Custodian} from "./Custodian.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @custom:security-contact guardcolombia@gmail.com, telegram @wanagrow 
contract USVP is 
    ERC20, 
    ERC20Burnable, 
    ERC20Pausable, 
    AccessControl, 
    ERC20Blocklist, 
    ERC20Custodian, 
    ERC20Permit, 
    ERC20Votes 
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant LIMITER_ROLE = keccak256("LIMITER_ROLE");
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    // Máximo suministro como constante
    uint256 public constant MAX_SUPPLY = 1000000000 * 10 ** 18; // 1 billón de tokens
    
    // Evento para tracking de mint
    event TokensMinted(address indexed to, uint256 amount, uint256 totalSupply);

    constructor(
        address defaultAdmin, 
        address pauser, 
        address minter, 
        address limiter, 
        address custodian
    )
        ERC20("USVP", "USVP")
        ERC20Permit("USVP")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, pauser);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(LIMITER_ROLE, limiter);
        _grantRole(CUSTODIAN_ROLE, custodian);
        
        // Mint inicial de 200 millones de tokens
        _mint(msg.sender, 200000000 * 10 ** decimals());
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "USVP: Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount, totalSupply());
    }

    function blockUser(address user) public onlyRole(LIMITER_ROLE) {
        _blockUser(user);
    }

    function unblockUser(address user) public onlyRole(LIMITER_ROLE) {
        _unblockUser(user);
    }

    function _isCustodian(address user) internal view override returns (bool) {
        return hasRole(CUSTODIAN_ROLE, user);
    }

    // Función para consultar el restante que se puede mintear
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    // The following functions are overrides required by Solidity.
    function _update(
        address from, 
        address to, 
        uint256 value
    ) internal override(ERC20, ERC20Pausable, ERC20Blocklist, ERC20Custodian, ERC20Votes) {
        super._update(from, to, value);
    }

    function _approve(
        address owner, 
        address spender, 
        uint256 value, 
        bool emitEvent
    ) internal override(ERC20, ERC20Blocklist) {
        super._approve(owner, spender, value, emitEvent);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}