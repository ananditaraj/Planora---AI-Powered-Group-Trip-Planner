// ====================================
// GLOBAL TRIP DATA OBJECT & STATES
// ====================================
let tripData = {
    tripName: "",
    destination: "",
    startDate: "",
    endDate: "",
    duration: 0,
    budget: 0,
    memberCount: 0,
    interests: [],
    notes: "",
    members: []
};

let selectedInterests = [];
let currentMemberInterests = [];

// ====================================
// INITIALIZATION & LOCALSTORAGE RESUME
// ====================================
document.addEventListener("DOMContentLoaded", () => {
    // Hide Step 2 and Step 3 views on start default
    document.getElementById("step2").style.display = "none";
    document.getElementById("step3").style.display = "none";

    // Configure Date bounds dynamically (Today onwards)
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("startDate").min = today;
    document.getElementById("endDate").min = today;

    // NEW LOGIC: Check if user has an active session saved
    const savedData = localStorage.getItem("activeTripPlan");
    if (savedData) {
        try {
            tripData = JSON.parse(savedData);
            showToast("Resumed your unsaved trip draft! ✈️");
            // Hydrate values back to arrays
            selectedInterests.push(...tripData.interests);
            
            // Auto-advance user back to Step 2 if Step 1 was fully filled out
            if (tripData.tripName) {
                showStep2();
                updateStepper(2);
                renderMembers();
            }
        } catch (e) {
            console.error("Error restoration session", e);
        }
    }
});

// ====================================
// EVENT LISTENERS
// ====================================

// Cascade Date Min constraints + Prevent reverse-date mismatch bugs
document.getElementById("startDate").addEventListener("change", function () {
    const endDateInput = document.getElementById("endDate");
    endDateInput.min = this.value;
    
    // NEW LOGIC: If start date is shifted past current end date, clear end date
    if (endDateInput.value && new Date(this.value) > new Date(endDateInput.value)) {
        endDateInput.value = "";
        showToast("Start date changed. Please re-select a valid end date.");
    }
});

// Step 1: Manage primary Interest Buttons toggles
const interestButtons = document.querySelectorAll(".interest-btn");
interestButtons.forEach(button => {
    button.addEventListener("click", () => {
        button.classList.toggle("active");
        const interest = button.value;

        if (button.classList.contains("active")) {
            if (!selectedInterests.includes(interest)) {
                selectedInterests.push(interest);
            }
        } else {
            const index = selectedInterests.indexOf(interest);
            if (index > -1) {
                selectedInterests.splice(index, 1);
            }
        }
    });
});

// Step 2: Manage Member-specific Interest Buttons
const memberButtons = document.querySelectorAll(".member-interest");
memberButtons.forEach(button => {
    button.addEventListener("click", () => {
        button.classList.toggle("active");
        const value = button.value;

        if (button.classList.contains("active")) {
            currentMemberInterests.push(value);
        } else {
            currentMemberInterests = currentMemberInterests.filter(item => item !== value);
        }
    });
});

// Workflow Navigation Triggers
document.getElementById("nextBtn").addEventListener("click", saveStep1);
document.getElementById("addMemberBtn").addEventListener("click", addMember);
document.getElementById("reviewBtn").addEventListener("click", showReviewPage);

document.getElementById("generatePlanBtn")
.addEventListener("click", generatePlan);

// ====================================
// CORE WORKFLOW FUNCTIONS
// ====================================

function updateStepper(step) {
    const step1 = document.getElementById("stepIndicator1");
    const step2 = document.getElementById("stepIndicator2");
    const step3 = document.getElementById("stepIndicator3");

    if(!step1 || !step2 || !step3) return;

    step1.classList.remove("active");
    step2.classList.remove("active");
    step3.classList.remove("active");

    if (step === 1) step1.classList.add("active");
    if (step === 2) step2.classList.add("active");
    if (step === 3) step3.classList.add("active");
}

function saveStep1() {
    const tripName = document.getElementById("tripName").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const budget = document.getElementById("budget").value;
    const memberCount = document.getElementById("memberCount").value;
    const notes = document.getElementById("notes").value.trim();

    // Validations
    if (tripName === "") return showToast("Please enter a trip name.");
    if (destination === "") return showToast("Please enter a destination.");
    if (!startDate || !endDate) return showToast("Please select both dates.");
    
    if (new Date(endDate) <= new Date(startDate)) {
        return showToast("End date must be after the start date.");
    }
    if (budget === "" || Number(budget) <= 0) {
        return showToast("Please enter a valid budget.");
    }
    if (memberCount === "" || Number(memberCount) <= 0) {
        return showToast("Please enter the number of members.");
    }
    if (selectedInterests.length === 0) {
        return showToast("Please select at least one interest.");
    }

    // Processing & Calculations
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Storing to global footprint
    tripData.tripName = tripName;
    tripData.destination = destination;
    tripData.startDate = startDate;
    tripData.endDate = endDate;
    tripData.duration = duration;
    tripData.budget = Number(budget);
    tripData.memberCount = Number(memberCount);
    tripData.notes = notes;
    tripData.interests = [...selectedInterests];

    // Save progress state to localStorage
    localStorage.setItem("activeTripPlan", JSON.stringify(tripData));

    showToast("Step 1 completed successfully!");
    showStep2();
    updateStepper(2);
}

function showStep2() {
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
    updateBudgetStatus(); // Initialize calculation card on Step 2 launch
}

function addMember() {
    if (tripData.members.length >= tripData.memberCount) {
        showToast(`Cap reached! Only ${tripData.memberCount} members allowed.`);
        return;
    }

    const name = document.getElementById("memberName").value.trim();
    const budget = document.getElementById("memberBudget").value;

    if (name === "") return showToast("Please enter member name.");
    if (budget === "" || Number(budget) <= 0) return showToast("Please enter an individual budget.");

    // DYNAMIC ALERT LOGIC: Isolates the validation math down to the exact Rupee before adding the member
    const currentSpent = tripData.members.reduce((sum, m) => sum + m.budget, 0);
    const remainingReserve = tripData.budget - currentSpent;

    if (Number(budget) > remainingReserve) {
        const deficit = Number(budget) - remainingReserve;
        showToast(`⚠️ Warning: Individual budget exceeds remaining pool by ₹${deficit.toLocaleString()}!`);
        // We let them pass through with an active layout warning toast
    }

    const member = {
        name: name,
        budget: Number(budget),
        interests: [...currentMemberInterests]
    };

    tripData.members.push(member);
    
    // Save updated data arrays back to session storage
    localStorage.setItem("activeTripPlan", JSON.stringify(tripData));

    renderMembers();
    clearMemberForm();

    // If it didn't trigger an over-budget layout warning, fire the normal success/remaining metrics toast
    if (Number(budget) <= remainingReserve) {
        updateBudgetStatus();
    }
}
function calculateGroupCompatibility() {
    if (tripData.members.length < 2) return;

    // Track how many times each interest is selected across members
    const interestCounts = {};
    tripData.members.forEach(member => {
        member.interests.forEach(interest => {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
    });

    // Find the highest overlapping interest count
    const memberCount = tripData.members.length;
    let maxOverlap = 0;
    let sharedInterest = "";

    for (const [interest, count] of Object.entries(interestCounts)) {
        if (count > maxOverlap) {
            maxOverlap = count;
            sharedInterest = interest;
        }
    }

    // Convert to percentage compatibility score
    const compatibilityScore = Math.round((maxOverlap / memberCount) * 100);

    if (compatibilityScore >= 70) {
        showToast(`🔥 High Vibe Match! ${compatibilityScore}% of your group wants to do: ${sharedInterest}!`);
    }
}

// Drop this execution line at the very bottom of your existing addMember() function:
// calculateGroupCompatibility();

function removeMember(index) {
    tripData.members.splice(index, 1);
    localStorage.setItem("activeTripPlan", JSON.stringify(tripData));
    renderMembers();
    updateBudgetStatus();
    showToast("Member removed");
}

// ====================================
// UPDATED BUDGET NOTIFICATION LOGIC
// ====================================
function updateBudgetStatus() {
    const totalGroupBudget = tripData.budget;
    const aggregateSpent = tripData.members.reduce((sum, m) => sum + m.budget, 0);
    const leftOver = totalGroupBudget - aggregateSpent;

    // Create a clean, text-based notification string
    let message = `Pool: ₹${totalGroupBudget.toLocaleString()} | Allocated: ₹${aggregateSpent.toLocaleString()} | `;
    
    if (leftOver < 0) {
        message += `⚠️ Overbudget by ₹${Math.abs(leftOver).toLocaleString()}!`;
    } else {
        message += `Remaining: ₹${leftOver.toLocaleString()}`;
    }

    // Fire the toast design immediately
    showToast(message);
}

function renderMembers() {
    const container = document.getElementById("membersContainer");
    if(!container) return;
    container.innerHTML = "";

    tripData.members.forEach((member, index) => {
        const initials = member.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase();

        container.innerHTML += `
        <div class="member-card">
            <div class="member-left">
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>₹${member.budget.toLocaleString()}</p>
                    <div class="member-tags">
                        ${member.interests.map(interest => `<span class="tag">${interest}</span>`).join("")}
                    </div>
                </div>
            </div>
            <button class="delete-btn" onclick="removeMember(${index})">✕</button>
        </div>`;
    });
}

function clearMemberForm() {
    document.getElementById("memberName").value = "";
    document.getElementById("memberBudget").value = "";
    currentMemberInterests = [];
    document.querySelectorAll(".member-interest").forEach(btn => {
        btn.classList.remove("active");
    });
}

function showReviewPage() {
    // NEW LOGIC: Soft validation warning if member allocation slots aren't full yet
    if (tripData.members.length < tripData.memberCount) {
        if (!confirm(`You configured space for ${tripData.memberCount} members, but only added ${tripData.members.length}. Proceed anyway?`)) {
            return;
        }
    }
    
    if (tripData.members.length === 0) {
        showToast("Please add at least one member to your roster.");
        return;
    }

    updateStepper(3);
    document.getElementById("step2").style.display = "none";
    document.getElementById("step3").style.display = "block";
    renderReview();
}

function renderReview() {
    const review = document.getElementById("reviewContainer");
    if(!review) return;
    
    const aggregateSpent = tripData.members.reduce((sum, m) => sum + m.budget, 0);

    review.innerHTML = `
        <div class="review-card">
            <h3>${tripData.tripName}</h3>
            <p><strong>Destination:</strong> ${tripData.destination}</p>
            <p><strong>Duration:</strong> ${tripData.duration} Days (${tripData.startDate} to ${tripData.endDate})</p>
            <p><strong>Base Target Budget:</strong> ₹${tripData.budget.toLocaleString()}</p>
            <p><strong>Calculated Cost Outlay:</strong> ₹${aggregateSpent.toLocaleString()}</p>
            <p><strong>Roster:</strong> ${tripData.members.length} / ${tripData.memberCount} Members added</p>
        </div>
        <div class="review-card">
            <h3>Unified Collective Interests</h3>
            <p>${tripData.interests.join(", ") || "None selected"}</p>
        </div>
    `;

    tripData.members.forEach(member => {
        review.innerHTML += `
            <div class="member-card">
                <h4>${member.name}</h4>
                <p>Allocation Cap: ₹${member.budget.toLocaleString()}</p>
                <small>Interests: ${member.interests.join(", ") || "Generic traveler"}</small>
            </div>`;
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

async function generatePlan(){

    try{

        showToast("Generating your AI travel plan... ✨");

        const response = await fetch(
            "/generate-plan",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify(tripData)
            }
        );

        const data =
        await response.json();

        console.log(data);

        localStorage.removeItem(
            "activeTripPlan"
        );

        showToast(
            "Travel plan generated successfully!"
        );

        // For now just show result
        document
        .getElementById("reviewContainer")
        .innerHTML += `

        <div class="review-card">

            <h3>AI Recommendation ✨</h3>

            <p>${data.plan}</p>

        </div>

        `;

    }

    catch(error){

        console.error(error);

        showToast(
            "Failed to generate plan."
        );
    }
}