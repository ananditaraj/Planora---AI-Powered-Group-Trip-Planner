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
// INITIALIZATION & DOM READY HOOKS
// ====================================
document.addEventListener("DOMContentLoaded", () => {
    // Hide Step 2 and Step 3 views natively on launch
    const step2El = document.getElementById("step2");
    const step3El = document.getElementById("step3");
    if (step2El) step2El.style.display = "none";
    if (step3El) step3El.style.display = "none";

    // Establish calendar boundaries
    const today = new Date().toISOString().split("T")[0];
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    
    if (startDateInput) startDateInput.min = today;
    if (endDateInput) endDateInput.min = today;

    // Date cascade change listener
    if (startDateInput) {
        startDateInput.addEventListener("change", function () {
            if (!endDateInput) return;
            endDateInput.min = this.value;
            if (endDateInput.value && new Date(this.value) > new Date(endDateInput.value)) {
                endDateInput.value = "";
                showToast("Start date changed. Please re-select a valid end date.");
            }
        });
    }

    // Step 1: Primary interest tag button toggles
    document.querySelectorAll(".interest-btn").forEach(button => {
        button.addEventListener("click", () => {
            button.classList.toggle("active");
            const interest = button.value;
            if (button.classList.contains("active")) {
                if (!selectedInterests.includes(interest)) selectedInterests.push(interest);
            } else {
                const index = selectedInterests.indexOf(interest);
                if (index > -1) selectedInterests.splice(index, 1);
            }
        });
    });

    // Step 2: Individual member interest button toggles
    document.querySelectorAll(".member-interest").forEach(button => {
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

    // Workflow Navigation Assignment
    const nextBtn = document.getElementById("nextBtn");
    const addMemberBtn = document.getElementById("addMemberBtn");
    const reviewBtn = document.getElementById("reviewBtn");
    const generatePlanBtn = document.getElementById("generatePlanBtn");

    if (nextBtn) nextBtn.addEventListener("click", saveStep1);
    if (addMemberBtn) addMemberBtn.addEventListener("click", addMember);
    if (reviewBtn) reviewBtn.addEventListener("click", showReviewPage);
    if (generatePlanBtn) generatePlanBtn.addEventListener("click", generatePlan);
});

// ====================================
// SYSTEM STEP WORKFLOW ENGINES
// ====================================
function updateStepper(step) {
    const step1 = document.getElementById("stepIndicator1");
    const step2 = document.getElementById("stepIndicator2");
    const step3 = document.getElementById("stepIndicator3");
    if (!step1 || !step2 || !step3) return;

    step1.classList.remove("active");
    step2.classList.remove("active");
    step3.classList.remove("active");

    if (step === 1) step1.classList.add("active");
    if (step === 2) step2.classList.add("active");
    if (step === 3) step3.classList.add("active");
}

function saveStep1() {
    const tripName = document.getElementById("tripName")?.value.trim() || "";
    const destination = document.getElementById("destination")?.value || "";
    const startDate = document.getElementById("startDate")?.value || "";
    const endDate = document.getElementById("endDate")?.value || "";
    const budget = document.getElementById("budget")?.value || "";
    const memberCount = document.getElementById("memberCount")?.value || "";
    const notes = document.getElementById("notes")?.value.trim() || "";

    if (tripName === "") return showToast("Please enter a trip name.");
    if (destination === "") return showToast("Please select a destination type.");
    if (!startDate || !endDate) return showToast("Please select both dates.");
    if (new Date(endDate) <= new Date(startDate)) return showToast("End date must be after start date.");
    if (budget === "" || Number(budget) <= 0) return showToast("Please enter a valid budget.");
    if (memberCount === "" || Number(memberCount) <= 0) return showToast("Please specify member counts.");
    if (selectedInterests.length === 0) return showToast("Select at least one interest tag.");

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    tripData.tripName = tripName;
    tripData.destination = destination;
    tripData.startDate = startDate;
    tripData.endDate = endDate;
    tripData.duration = duration;
    tripData.budget = Number(budget);
    tripData.memberCount = Number(memberCount);
    tripData.notes = notes;
    tripData.interests = [...selectedInterests];

    const step1View = document.getElementById("step1");
    const step2View = document.getElementById("step2");
    if (step1View) step1View.style.display = "none";
    if (step2View) step2View.style.display = "block";
    
    updateStepper(2);
    updateBudgetStatus();
}

function addMember() {
    if (tripData.members.length >= tripData.memberCount) {
        return showToast(`Roster cap limit hit! Max is ${tripData.memberCount}.`);
    }

    const name = document.getElementById("memberName")?.value.trim() || "";
    const budget = document.getElementById("memberBudget")?.value || "";

    if (name === "") return showToast("Please enter member name.");
    if (budget === "" || Number(budget) <= 0) return showToast("Enter an individual budget allocation.");

    const member = {
        name: name,
        budget: Number(budget),
        interests: [...currentMemberInterests]
    };

    tripData.members.push(member);
    renderMembers();
    clearMemberForm();
    updateBudgetStatus();
    calculateGroupCompatibility();
}

function calculateGroupCompatibility() {
    if (tripData.members.length < 2) return;
    const interestCounts = {};
    tripData.members.forEach(m => {
        m.interests.forEach(i => interestCounts[i] = (interestCounts[i] || 0) + 1);
    });

    let maxOverlap = 0;
    let sharedInterest = "";
    for (const [interest, count] of Object.entries(interestCounts)) {
        if (count > maxOverlap) { maxOverlap = count; sharedInterest = interest; }
    }
    const score = Math.round((maxOverlap / tripData.members.length) * 100);
    if (score >= 70) showToast(`High Vibe Match! ${score}% match on doing ${sharedInterest}.`);
}

function removeMember(index) {
    tripData.members.splice(index, 1);
    renderMembers();
    updateBudgetStatus();
    showToast("Member removed.");
}

function updateBudgetStatus() {
    const spent = tripData.members.reduce((sum, m) => sum + m.budget, 0);
    const leftOver = tripData.budget - spent;
    let message = `Pool: ₹${tripData.budget.toLocaleString()} | Allocated: ₹${spent.toLocaleString()} | `;
    message += leftOver < 0 ? `Overbudget by ₹${Math.abs(leftOver).toLocaleString()}!` : `Remaining: ₹${leftOver.toLocaleString()}`;
    showToast(message);
}

function renderMembers() {
    const container = document.getElementById("membersContainer");
    if (!container) return;
    container.innerHTML = "";

    tripData.members.forEach((member, index) => {
        const initials = member.name.split(" ").map(w => w[0]).join("").toUpperCase();
        container.innerHTML += `
        <div class="member-card">
            <div class="member-left">
                <div class="member-avatar">${initials}</div>
                <div class="member-info">
                    <h4>${member.name}</h4>
                    <p>₹${member.budget.toLocaleString()}</p>
                    <div class="member-tags">
                        ${member.interests.map(i => `<span class="tag">${i}</span>`).join("")}
                    </div>
                </div>
            </div>
            <button type="button" class="delete-btn" onclick="removeMember(${index})">✕</button>
        </div>`;
    });
}

function clearMemberForm() {
    const memberNameInput = document.getElementById("memberName");
    const memberBudgetInput = document.getElementById("memberBudget");
    if (memberNameInput) memberNameInput.value = "";
    if (memberBudgetInput) memberBudgetInput.value = "";
    currentMemberInterests = [];
    document.querySelectorAll(".member-interest").forEach(btn => btn.classList.remove("active"));
}

function showReviewPage() {
    if (tripData.members.length === 0) return showToast("Please add at least one traveler to your roster.");

    if (tripData.members.length >= tripData.memberCount) {
        executeTransitionToStep3();
        return;
    }

    const modal = document.getElementById("customConfirmModal");
    const message = document.getElementById("modalConfirmMessage");
    const okBtn = document.getElementById("modalOkBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    if (!modal) { executeTransitionToStep3(); return; }

    message.innerHTML = `You configured space for <strong>${tripData.memberCount}</strong> members, but only added <strong>${tripData.members.length}</strong>. Proceed?`;
    modal.classList.add("show");

    okBtn.onclick = () => { modal.classList.remove("show"); executeTransitionToStep3(); };
    cancelBtn.onclick = () => modal.classList.remove("show");
}

function executeTransitionToStep3() {
    const step2View = document.getElementById("step2");
    const step3View = document.getElementById("step3");
    if (step2View) step2View.style.display = "none";
    if (step3View) step3View.style.display = "block";
    updateStepper(3);
    renderReview();
}

function renderReview() {
    const review = document.getElementById("reviewContainer");
    if (!review) return;
    const spent = tripData.members.reduce((sum, m) => sum + m.budget, 0);

    review.innerHTML = `
        <div class="review-card">
            <h3>${tripData.tripName}</h3>
            <p><strong>Destination Type:</strong> ${tripData.destination}</p>
            <p><strong>Duration:</strong> ${tripData.duration} Days (${tripData.startDate} to ${tripData.endDate})</p>
            <p><strong>Base Capital Pool:</strong> ₹${tripData.budget.toLocaleString()}</p>
            <p><strong>Calculated Cost Outlay:</strong> ₹${spent.toLocaleString()}</p>
        </div>
        <div class="review-card">
            <h3>Unified Group Interests</h3>
            <p>${tripData.interests.join(", ")}</p>
        </div>
    `;
}

// ====================================
// ASYNCHRONOUS GENERATION & RENDERING
// ====================================
async function generatePlan() {
    try {
        showToast("Generating your AI travel plan... ✨");
        
        const response = await fetch("/generate-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tripData)
        });

        if (!response.ok) throw new Error("Server communication fault");
        const data = await response.json();

        showToast("Travel plan generated successfully!");

        // 1. Process Day Schedule Array objects safely
        let daysHtml = "";
        if (data && data.days && Array.isArray(data.days)) {
            data.days.forEach(d => {
                daysHtml += `
                    <div class="day-card" style="background: #ffffff; border: 1px solid #eae5e0; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(43,41,39,0.03); transition: transform 0.2s ease;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px dashed #efeae4; padding-bottom: 12px;">
                            <span style="background: #a67377; color: #ffffff; font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px;">Day ${d.day}</span>
                            <h4 style="font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #2b2927; margin: 0;">${d.title || 'Explore'}</h4>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <p style="font-size: 14px; margin: 0; color: #57524e; line-height: 1.6;"><strong style="color: #a67377; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">🌅 Morning</strong>${d.morning || 'Leisure time'}</p>
                            <p style="font-size: 14px; margin: 0; color: #57524e; line-height: 1.6;"><strong style="color: #a67377; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">☀️ Afternoon</strong>${d.afternoon || 'Leisure time'}</p>
                            <p style="font-size: 14px; margin: 0; color: #57524e; line-height: 1.6;"><strong style="color: #a67377; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">🌙 Evening</strong>${d.evening || 'Leisure time'}</p>
                        </div>
                    </div>
                `;
            });
        }

        // 2. Process Packing List values array strings safely
        let packingHtml = "";
        if (data && data.packing_list && Array.isArray(data.packing_list)) {
            packingHtml = data.packing_list.map(item => `
                <li style="background: #ffffff; border: 1px solid #efeae4; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #57524e; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.01);">
                    <span style="color: #a67377; font-weight: bold;">✓</span> ${item}
                </li>
            `).join("");
        }

        // 3. Fallback extraction layer for budget breakdowns
        const breakdown = data.budget_breakdown || {};
        const accommodationText = breakdown.accommodation || "Arranged within budget allowances";
        const foodText = breakdown.food || "Arranged within budget allowances";
        const transportText = breakdown.transport || "Arranged within budget allowances";
        const activitiesText = breakdown.activities || "Arranged within budget allowances";

        // 4. Construct Unified Output inside the target container
        const outputContainer = document.getElementById("finalItineraryOutput");
        if (outputContainer) {
            outputContainer.innerHTML = `
                <div id="aiRecommendation" style="border-top: 2px solid #E3B7BA; padding-top: 40px; margin-top: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    
                    <div style="text-align: center; margin-bottom: 40px;">
                        <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #a67377; font-weight: 600; display: block; margin-bottom: 8px;">Your Bespoke Guide</span>
                        <h1 style="font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 700; color: #2b2927; margin: 0 0 16px 0; letter-spacing: -0.5px;">Planora Travel Itinerary</h1>
                        <div style="max-width: 650px; margin: 0 auto;">
                            <p style="font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; color: #6e6864; line-height: 1.6; margin: 0;">"${data.summary || ''}"</p>
                        </div>
                    </div>

                    <div style="background: #faf8f5; border: 1px solid #efeae4; padding: 30px; margin-bottom: 40px; border-radius: 16px; display: grid; grid-template-columns: 1fr 2fr; gap: 30px; align-items: center;">
                        <div style="border-right: 1px solid #efeae4; padding-right: 20px;">
                            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a67377; font-weight: 600; display: block; margin-bottom: 4px;">Destination</span>
                            <h2 style="font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #2b2927; margin: 0;">${data.destination || 'N/A'}</h2>
                        </div>
                        <div>
                            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a67377; font-weight: 600; display: block; margin-bottom: 6px;">Why this destination?</span>
                            <p style="font-size: 15px; color: #57524e; line-height: 1.6; margin: 0;">${data.why_this_destination || 'Tailored precisely to suit your group metrics and unified balance of specific interests.'}</p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-bottom: 40px;">
                        
                        <div>
                            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #2b2927; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #a67377;">📅</span> Daily Schedule
                            </h3>
                            <div>${daysHtml}</div>
                        </div>

                        <div>
                            <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #2b2927; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #a67377;">🧳</span> Packing Curations
                            </h3>
                            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; margin: 0;">
                                ${packingHtml || '<li style="background: #ffffff; border: 1px solid #efeae4; padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #57524e;">Standard clothing items</li>'}
                            </ul>
                        </div>
                    </div>

                    <div style="background: #faf8f5; border: 1px solid #efeae4; border-radius: 16px; padding: 30px;">
                        <h3 style="font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #2b2927; margin: 0 0 20px 0; text-align: center;">💰 Estimated Budget Breakdown</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                            <div style="background: #ffffff; border: 1px solid #eae5e0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);">
                                <strong style="color: #a67377; display: block; font-size: 15px; margin-bottom: 6px;">🏠 Accommodation</strong>
                                <p style="margin: 0; font-size: 13px; color: #6e6864; line-height: 1.5;">${accommodationText}</p>
                            </div>
                            <div style="background: #ffffff; border: 1px solid #eae5e0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);">
                                <strong style="color: #a67377; display: block; font-size: 15px; margin-bottom: 6px;">🍔 Food & Dining</strong>
                                <p style="margin: 0; font-size: 13px; color: #6e6864; line-height: 1.5;">${foodText}</p>
                            </div>
                            <div style="background: #ffffff; border: 1px solid #eae5e0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);">
                                <strong style="color: #a67377; display: block; font-size: 15px; margin-bottom: 6px;">🚗 Transport</strong>
                                <p style="margin: 0; font-size: 13px; color: #6e6864; line-height: 1.5;">${transportText}</p>
                            </div>
                            <div style="background: #ffffff; border: 1px solid #eae5e0; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.01);">
                                <strong style="color: #a67377; display: block; font-size: 15px; margin-bottom: 6px;">🎟️ Activities</strong>
                                <p style="margin: 0; font-size: 13px; color: #6e6864; line-height: 1.5;">${activitiesText}</p>
                            </div>
                        </div>
                    </div>

                </div>
            `;
            
            const recommendationEl = document.getElementById("aiRecommendation");
            if (recommendationEl) recommendationEl.scrollIntoView({ behavior: 'smooth' });
        }
    } catch(error) {
        console.error("Transmission or Mapping Error Trace:", error);
        showToast("Failed to compile itinerary payload maps.");
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => toast.classList.remove("show"), 3000);
}