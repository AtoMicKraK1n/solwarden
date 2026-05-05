use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod sentio_anchor_risky {
    use super::*;

    pub fn insecure_transfer(ctx: Context<InsecureTransfer>, amount: u64) -> Result<()> {
        // No explicit mint or authority validation in logic either.
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.from_ata.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InsecureTransfer<'info> {
    pub authority: Signer<'info>, // not mut (if modified later -> mut issue)

    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>, // missing token::mint + token::authority

    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>, // missing token::mint

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 16,
        seeds = [b"vault", authority.key().as_ref()]
        // bump missing
    )]
    pub vault: Account<'info, VaultState>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultState {
    pub amount: u64,
}