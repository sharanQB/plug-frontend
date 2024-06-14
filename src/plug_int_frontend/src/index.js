// Global object to store DOM element references
const els = {};

// Canister Ids
const nnsCanisterId = 'qoctq-giaaa-aaaaa-aaaea-cai';

// Whitelist
const whitelist = [
  nnsCanisterId,
];

const nnsUi = ({ IDL }) => {
  const Stats = IDL.Record({
      'latest_transaction_block_height': IDL.Nat64,
      // Add other fields as per your actual canister interface
  });
  return IDL.Service({
      'get_stats': IDL.Func([], [Stats], ['query']),
      // Define other methods your NNS canister has
  });
};

function main() {
    // Initialize element references
    els.btnTitle = document.querySelector('#btn-title');
    els.nnsStatsContainer = document.querySelector('#nns-stats-container');
    els.button = document.querySelector('#button-connect');
    
    // Ensure elements are found before adding event listeners
    if (els.btnTitle && els.nnsStatsContainer && els.button) {
        els.button.addEventListener("click", onButtonPress);
    } else {
        console.error("One or more elements could not be found.");
    }
}

function onButtonPress(el) {
    els.button.disabled = true;
    window.ic?.plug?.requestConnect({ whitelist })
        .then(isConnected => {
            if (!isConnected) {
                els.btnTitle.textContent = "Plug wallet connection was refused";
                reset();
                return;
            }

            els.btnTitle.textContent = "Plug wallet is connected";
            return window.ic.plug.createActor({
                canisterId: nnsCanisterId,
                interfaceFactory: nnsUi,
            });
        })
        .then(NNSUiActor => {
            if (!NNSUiActor) {
                els.btnTitle.textContent = "Oops! Failed to initialise the NNS Actor...";
                throw new Error("NNS Actor initialisation failed");
            }
            return NNSUiActor.get_stats();
        })
        .then(stats => {
            if (!stats.hasOwnProperty('latest_transaction_block_height')) {
                throw new Error("latest_transaction_block_height field is missing in the received data.");
            }

            els.nnsStatsContainer.querySelector('#accounts_count').textContent = Number(stats.accounts_count);
            els.nnsStatsContainer.querySelector('#transactions_count').textContent = Number(stats.transactions_count);
            els.nnsStatsContainer.querySelector('#sub_accounts_count').textContent = Number(stats.sub_accounts_count);

            els.nnsStatsContainer.classList.remove('hidden');
            els.btnTitle.textContent = "Showing the NNS Stats";
        })
        .catch(error => {
            console.error('An error occurred:', error);
            els.btnTitle.textContent = "An error occurred. Please try again.";
        })
        .finally(() => {
            reset();
        });
}

function reset() {
    setTimeout(() => {
        els.btnTitle.textContent = "Connect with Plug";
        els.button.disabled = false;
    }, 5000);
}

// Add the event listener for DOMContentLoaded to ensure all elements are loaded before the script runs
document.addEventListener("DOMContentLoaded", main);
