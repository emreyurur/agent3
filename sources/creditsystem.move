// credit_system.move
module my_app::credit_system;

use std::option;
use std::string::{Self, String};
use std::vector;
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::vec_map::{Self, VecMap};

// --- Hata Kodları ---
const EOfferNotFound: u64 = 1;
const EIncorrectPaymentAmount: u64 = 2;
const EInsufficientCredits: u64 = 3;
const EAgentNotFound: u64 = 4;
const ENotAgentOwner: u64 = 5;
const ENoRevenueToWithdraw: u64 = 6;
const ECreditRateNotSet: u64 = 7;
const EInsufficientTreasury: u64 = 8;
const ECalculationOverflow: u64 = 9;
const EAgentHasRevenue: u64 = 10;

const EProfileExists: u64 = 101;
const EInvalidCreditRate: u64 = 102;
const ENotAuthorized: u64 = 103;

// --- Nesne Yapıları ---
struct AdminCap has key { id: UID, owner: address }
struct CreditOffer has copy, drop, store { id: u64, credit_amount: u64, sui_price_mist: u64 }
struct Agent has store {
    id: u64,
    name: String,
    url: String,
    owner: address,
    revenue_balance: Balance<SUI>,
}
struct AgentInfo has copy, drop, store {
    id: u64,
    name: String,
    url: String,
    owner: address,
    revenue_amount: u64,
}
struct UserProfile has key { id: UID, owner: address, credit_balance: u64 }
struct CreditSystem has key {
    id: UID,
    offers: VecMap<u64, CreditOffer>,
    agents: VecMap<u64, Agent>,
    treasury: Balance<SUI>,
    credit_to_mist_rate: u64,
    next_offer_id: u64,
    next_agent_id: u64,
    profiles: VecMap<address, ID>,
}

fun init(ctx: &mut TxContext) {
    let admin_address = tx_context::sender(ctx);
    transfer::transfer(AdminCap { id: object::new(ctx), owner: admin_address }, admin_address);
    transfer::share_object(CreditSystem {
        id: object::new(ctx),
        offers: vec_map::empty(),
        agents: vec_map::empty(),
        treasury: balance::zero(),
        credit_to_mist_rate: 0,
        next_offer_id: 0,
        next_agent_id: 0,
        profiles: vec_map::empty(),
    });
}

entry fun add_offer(
    admin_cap: &AdminCap,
    system: &mut CreditSystem,
    credit_amount: u64,
    sui_price_mist: u64,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.owner == tx_context::sender(ctx), ENotAuthorized);
    let offer_id = system.next_offer_id;
    vec_map::insert(
        &mut system.offers,
        offer_id,
        CreditOffer { id: offer_id, credit_amount, sui_price_mist },
    );
    system.next_offer_id = offer_id + 1;
}

entry fun remove_offer(
    admin_cap: &AdminCap,
    system: &mut CreditSystem,
    offer_id: u64,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.owner == tx_context::sender(ctx), ENotAuthorized);
    assert!(vec_map::contains(&system.offers, &offer_id), EOfferNotFound);
    let (_, _) = vec_map::remove(&mut system.offers, &offer_id);
}

entry fun set_credit_rate(
    admin_cap: &AdminCap,
    system: &mut CreditSystem,
    rate: u64,
    ctx: &mut TxContext,
) {
    assert!(admin_cap.owner == tx_context::sender(ctx), ENotAuthorized);
    assert!(rate > 0, EInvalidCreditRate);
    system.credit_to_mist_rate = rate;
}

// Tüm mevcut kredi tekliflerini döndürür
public fun get_offers(system: &CreditSystem): vector<CreditOffer> {
    let offers = vector::empty<CreditOffer>();
    let keys = vec_map::keys(&system.offers);
    let i = 0;
    let len = vector::length(&keys);

    while (i < len) {
        let key = *vector::borrow(&keys, i);
        let offer = *vec_map::get(&system.offers, &key);
        vector::push_back(&mut offers, offer);
        i = i + 1;
    };

    offers
}

// Kullanıcının kredi bakiyesini döndürür
public fun get_user_credit_balance(profile: &UserProfile): u64 {
    profile.credit_balance
}

// Belirli bir kullanıcının profil ID'sini döndürür (eğer varsa)
public fun get_user_profile_id(system: &CreditSystem, user_address: address): option::Option<ID> {
    if (vec_map::contains(&system.profiles, &user_address)) {
        option::some(*vec_map::get(&system.profiles, &user_address))
    } else {
        option::none()
    }
}

// Tüm agent'ları döndürür
public fun get_agents(system: &CreditSystem): vector<AgentInfo> {
    let agents = vector::empty<AgentInfo>();
    let keys = vec_map::keys(&system.agents);
    let i = 0;
    let len = vector::length(&keys);

    while (i < len) {
        let key = *vector::borrow(&keys, i);
        let agent = vec_map::get(&system.agents, &key);
        let agent_info = AgentInfo {
            id: agent.id,
            name: agent.name,
            url: agent.url,
            owner: agent.owner,
            revenue_amount: balance::value(&agent.revenue_balance),
        };
        vector::push_back(&mut agents, agent_info);
        i = i + 1;
    };

    agents
}

entry fun create_user_profile(system: &mut CreditSystem, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(!vec_map::contains(&system.profiles, &sender), EProfileExists);
    let profile = UserProfile { id: object::new(ctx), owner: sender, credit_balance: 0 };
    vec_map::insert(&mut system.profiles, sender, object::id(&profile));
    transfer::transfer(profile, sender);
}

entry fun register_as_agent(
    system: &mut CreditSystem,
    name: vector<u8>,
    url: vector<u8>,
    ctx: &mut TxContext,
) {
    let agent_id = system.next_agent_id;
    let agent = Agent {
        id: agent_id,
        name: string::utf8(name),
        url: string::utf8(url),
        owner: tx_context::sender(ctx),
        revenue_balance: balance::zero(),
    };
    vec_map::insert(&mut system.agents, agent_id, agent);
    system.next_agent_id = agent_id + 1;
}

entry fun buy_credits(
    system: &mut CreditSystem,
    profile: &mut UserProfile,
    offer_id: u64,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == profile.owner, 0);
    assert!(vec_map::contains(&system.offers, &offer_id), EOfferNotFound);

    let offer = vec_map::get(&system.offers, &offer_id);
    assert!(coin::value(&payment) >= offer.sui_price_mist, EIncorrectPaymentAmount);

    let excess = coin::value(&payment) - offer.sui_price_mist;
    if (excess > 0) {
        transfer::public_transfer(coin::split(&mut payment, excess, ctx), tx_context::sender(ctx));
    };

    balance::join(&mut system.treasury, coin::into_balance(payment));
    profile.credit_balance = profile.credit_balance + offer.credit_amount;
}

entry fun use_agent_and_spend_credits(
    system: &mut CreditSystem,
    profile: &mut UserProfile,
    agent_id: u64,
    credits_to_spend: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == profile.owner, 0);
    assert!(profile.credit_balance >= credits_to_spend, EInsufficientCredits);
    assert!(vec_map::contains(&system.agents, &agent_id), EAgentNotFound);
    assert!(system.credit_to_mist_rate > 0, ECreditRateNotSet);

    profile.credit_balance = profile.credit_balance - credits_to_spend;

    let revenue_amount_u128 = (credits_to_spend as u128) * (system.credit_to_mist_rate as u128);
    assert!(revenue_amount_u128 <= 18446744073709551615, ECalculationOverflow);
    let revenue_amount_u64 = (revenue_amount_u128 as u64);

    assert!(balance::value(&system.treasury) >= revenue_amount_u64, EInsufficientTreasury);
    let revenue_balance = balance::split(&mut system.treasury, revenue_amount_u64);

    let agent = vec_map::get_mut(&mut system.agents, &agent_id);
    balance::join(&mut agent.revenue_balance, revenue_balance);
}

entry fun agent_withdraw_revenue(system: &mut CreditSystem, agent_id: u64, ctx: &mut TxContext) {
    assert!(vec_map::contains(&system.agents, &agent_id), EAgentNotFound);
    let agent = vec_map::get_mut(&mut system.agents, &agent_id);
    assert!(agent.owner == tx_context::sender(ctx), ENotAgentOwner);

    let amount_to_withdraw = balance::value(&agent.revenue_balance);
    assert!(amount_to_withdraw > 0, ENoRevenueToWithdraw);

    let revenue_balance = balance::split(&mut agent.revenue_balance, amount_to_withdraw);
    let revenue_coin = coin::from_balance(revenue_balance, ctx);
    transfer::public_transfer(revenue_coin, agent.owner);
}

entry fun transfer_agent_ownership(
    system: &mut CreditSystem,
    agent_id: u64,
    new_owner: address,
    ctx: &mut TxContext,
) {
    assert!(vec_map::contains(&system.agents, &agent_id), EAgentNotFound);
    let agent = vec_map::get_mut(&mut system.agents, &agent_id);
    assert!(agent.owner == tx_context::sender(ctx), ENotAgentOwner);
    agent.owner = new_owner;
}

entry fun remove_agent(system: &mut CreditSystem, agent_id: u64, ctx: &mut TxContext) {
    assert!(vec_map::contains(&system.agents, &agent_id), EAgentNotFound);

    let agent_ref = vec_map::get(&system.agents, &agent_id);
    assert!(agent_ref.owner == tx_context::sender(ctx), ENotAgentOwner);
    assert!(balance::value(&agent_ref.revenue_balance) == 0, EAgentHasRevenue);

    let (_id, removed_agent) = vec_map::remove(&mut system.agents, &agent_id);

    let Agent { id: _, name: _, url: _, owner: _, revenue_balance } = removed_agent;

    balance::destroy_zero(revenue_balance);
}

// === EVENTS ===
struct UserProfileIdEvent has copy, drop {
    user_address: address,
    profile_id: option::Option<ID>,
}

struct UserCreditBalanceEvent has copy, drop {
    profile_owner: address,
    credit_balance: u64,
}

struct OffersEvent has copy, drop {
    offers: vector<CreditOffer>,
}

struct AgentsEvent has copy, drop {
    agents: vector<AgentInfo>,
}

// === ENTRY WRAPPER FONKSİYONLARI (Remix için) ===

// Tüm teklifleri almak için entry fonksiyonu
entry fun get_offers_entry(system: &CreditSystem) {
    let offers = get_offers(system);
    event::emit(OffersEvent {
        offers,
    });
}

// Kullanıcı kredi bakiyesi için entry fonksiyonu
entry fun get_user_credit_balance_entry(profile: &UserProfile) {
    let balance = get_user_credit_balance(profile);
    event::emit(UserCreditBalanceEvent {
        profile_owner: profile.owner,
        credit_balance: balance,
    });
}

// Kullanıcı profil ID'si için entry fonksiyonu
entry fun get_user_profile_id_entry(system: &CreditSystem, user_address: address) {
    let profile_id = get_user_profile_id(system, user_address);
    event::emit(UserProfileIdEvent {
        user_address,
        profile_id,
    });
}

// Tüm agent'ları almak için entry fonksiyonu
entry fun get_agents_entry(system: &CreditSystem) {
    let agents = get_agents(system);
    event::emit(AgentsEvent {
        agents,
    });
}
