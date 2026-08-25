"""Build ECON 409 Environmental Economics from the 409 Drive folder.

Sources
  - "97th syllabus course.png"  -> the chapter spine (before-mid / after-mid)
  - Previous Years/Questions/   -> 15 papers, 2010-2022
"""
import json
from pathlib import Path

ROOT = Path(r"C:\Users\JB PLC\Desktop\New folder (2)\Claude")

S97 = "On the 97th-batch syllabus. "

chapters = [
    ("foundations", 1, "Economy–Environment Linkage, Thermodynamics & Entropy", "অর্থনীতি–পরিবেশ সংযোগ ও তাপগতিবিদ্যা",
     "Perman Ch. 1–2", "Not itemised on the 97th list but recurs in almost every final."),
    ("sustainability", 2, "Sustainability & Sustainable Development", "টেকসইতা ও টেকসই উন্নয়ন",
     "Perman Ch. 4", "Weak vs strong sustainability, Hartwick, Daly, measurement. A perennial Q1."),
    ("ethics", 3, "Environmental Ethics, Welfare Criteria & Discounting", "পরিবেশ নৈতিকতা ও অবচয়ন",
     "Perman Ch. 3", "Utilitarianism, Rawls, libertarian ethics; utility vs consumption discount rate."),
    ("limits", 4, "Limits to Growth & the Environmental Kuznets Curve", "প্রবৃদ্ধির সীমা ও EKC",
     "Perman Ch. 2, 13", "Includes the exponential-reserve-depletion calculation seen in the 2019 mid."),
    ("externalities", 5, "Externalities & Market Failure", "বাহ্যিকতা ও বাজার ব্যর্থতা",
     "Class PDF, up to p. 7", S97 + "The single most examined topic in the archive."),
    ("coase", 6, "Coase Theorem & Property Rights", "কোজ উপপাদ্য ও সম্পত্তি অধিকার",
     "Class material", "Assumptions, bargaining range, breakdown with many victims."),
    ("commons", 7, "Tragedy of the Commons & Open-Access Resources", "সাধারণ সম্পদের ট্র্যাজেডি",
     "Class material — full", S97 + "Grazing payoff matrix and unrestricted-entry model."),
    ("prisoners", 8, "Prisoner's Dilemma & Fisher's Dilemma", "বন্দীর দ্বিধা ও ফিশারের দ্বিধা",
     "Class material — full", S97 + "Open-access fishery as a non-cooperative game."),
    ("welfare", 9, "Welfare Economics and the Environment", "কল্যাণ অর্থনীতি ও পরিবেশ",
     "Perman Ch. 5, up to 5.3 (p. 9 of pdf)", S97 + "Compensating and equivalent variation, WTP vs WTA."),
    ("targets", 10, "Pollution Control: Targets", "দূষণ নিয়ন্ত্রণ: লক্ষ্যমাত্রা",
     "Perman Ch. 6, up to 6.11 (p. 25 of pdf)", S97 + "Efficient emission rule, stock vs flow pollutants."),
    ("instruments", 11, "Pollution Control: Instruments", "দূষণ নিয়ন্ত্রণ: উপকরণ",
     "Perman Ch. 7, up to p. 205", S97 + "Taxes, subsidies, permits, command-and-control, least-cost theorem."),
    ("uncertainty", 12, "Regulation under Uncertainty & Asymmetric Information", "অনিশ্চয়তায় নিয়ন্ত্রণ",
     "Class material", "Prices vs quantities, adverse selection, transfer coefficients, ambient permits."),
    ("solidwaste", 13, "Solid Waste Management", "কঠিন বর্জ্য ব্যবস্থাপনা",
     "Classroom, up to topic 6.3 (p. 15 of pdf)", S97 + "Source reduction, recycling — the 2022 in-course topic."),
    ("bca", 14, "Benefit–Cost Analysis", "সুবিধা–ব্যয় বিশ্লেষণ",
     "Classroom, up to p. 6 (up to materials damage)", S97),
    ("valuation", 15, "Environmental Valuation: TEV & Preference Methods", "পরিবেশগত মূল্যায়ন",
     "Class material", "Total economic value, use vs non-use, revealed vs stated preference, hedonic, benefit transfer."),
    ("travelcost", 16, "Travel Cost Method", "ভ্রমণ ব্যয় পদ্ধতি",
     "Slides, up to p. 23", S97 + "ITCM and ZTCM both appear."),
    ("cvm", 17, "Contingent Valuation Method", "শর্তসাপেক্ষ মূল্যায়ন পদ্ধতি",
     "Class material — full", S97 + "Biases, NOAA panel guidelines, WTP estimation from a bid function."),
    ("noise", 18, "Sound Pollution & Willingness to Pay", "শব্দদূষণ ও প্রদানেচ্ছা",
     "Class of 2.3.2023; see CVM introduction", S97 + "Flagged in the syllabus note as 'read the class lecture to be safe'."),
    ("sdg", 19, "SDG and Bangladesh", "এসডিজি ও বাংলাদেশ", "No reference given", S97),
    ("nudging", 20, "Nudging for Clean Air", "পরিচ্ছন্ন বাতাসের জন্য নাজ",
     "Sheet + mid question", S97 + "Syllabus note says: watch the mid question and the sheet, in full."),
    ("accounting", 21, "Environmental Accounting (SEEA)", "পরিবেশগত হিসাবায়ন",
     "SEEA water & energy accounts", "From '97th Short-questions-for-Environmental-Accounting.pdf' in the Drive."),
]

# (id, chapterId, examType, year, batch, qNo, marks, difficulty, topics, repeats, text)
Q = [
 # ---------------- 2022 in-course ----------------
 ("q-2022-i-1", "solidwaste", "incourse", 2022, "", "1", 10, "intermediate",
  ["Solid waste management", "Recycling"], [],
  "(A) Explain the purposes of source reduction / waste prevention in the context of urban waste management. (3) "
  "(B) What possible actions would you suggest to reduce waste generation? (4) "
  "(C) Explain the significance of recycling. (3)"),
 ("q-2022-i-2", "welfare", "incourse", 2022, "", "2", 5, "advanced",
  ["Welfare measurement", "Producer surplus"], [],
  "Consider two types of regional market supply curve. The supply curve of a group of farms after the damage of "
  "agricultural land from industrial toxic waste is S = 10 + 10q, and the supply curve of the same group of farms "
  "before the damage was S = 10 + 5q. Suppose the changes in the regional supply curve do not have any effect on "
  "the whole market prices in the economy. Consider the overall market demand and supply of the agricultural "
  "product are D = 1000 − 5P and S = 40 + 15P respectively. Now measure the impact of the industrial toxic waste "
  "on the agricultural farmers (show also graphically). (5)"),

 # ---------------- 2022 mid ----------------
 ("q-2022-m-1", "externalities", "midterm", 2022, "", "1", 10, "advanced",
  ["Externalities", "Market failure", "Monopoly"], [],
  "(a) How do externalities create market failure? Explain. (4) "
  "(b) Consider a monopoly market where the demand function is P = 100 − 2Q and MC = 10 + 10Q. The production of "
  "the firm imposes some cost on the people living beside the firm; assume the social marginal cost function is "
  "SMC = 3Q. Find the equilibrium level of private production. What is the socially optimal level of production? "
  "Explain your result. (6)"),
 ("q-2022-m-2", "commons", "midterm", 2022, "", "2", 10, "advanced",
  ["Tragedy of the commons", "Open access", "Payoff matrix"], [],
  "(a) Why does unrestricted entry lead to the over-exploitation of natural resources? Explain the relevant model "
  "using a graphical approach. (5) "
  "(b) Each member of a group of neighbouring farmers prefers to allow his cow to graze on the commons rather than "
  "keeping it on his own inadequate land, but the commons will be rendered unsuitable for grazing if it is "
  "overgrazed. The value of milk produced f(c) depends on the number of cows on the common land and the production "
  "function follows diminishing marginal productivity. A cow costs a dollars and can be grazed on common land. "
  "Explain the concept of the tragedy of the commons using the payoff matrix (game) based on the above production "
  "and cost functions. (5)"),
 ("q-2022-m-3", "nudging", "midterm", 2022, "", "3", 10, "advanced",
  ["Nudging for clean air", "Household optimisation", "Air pollution"], [],
  "Assume that during the cold months of winter, household i obtains utility from indoor temperature comfort (T) "
  "and from consumption of other goods (Z). Meanwhile the household members suffer from the adverse effects of "
  "wood-burning air pollution, so they perceive negative utility from exposure to local ambient air pollution (E). "
  "Let Uᵢ = U(T, Z, E). Indoor temperature comfort is a function of wood-fuel usage (w) and the choking of the "
  "woodstove's damper (c): T = T(w, c). Household-level emissions are e = e(w, c) and aggregate ambient air "
  "pollution is E = Σeᵢ(w, c). Households face a budget constraint in which disposable income must be no less than "
  "total expenditure on consumption goods and wood fuel, where the price of the composite consumption good Z is "
  "set equal to one and P_w denotes the price of wood fuel. "
  "(i) Prepare the budget constraint for a hypothetical household. (1) "
  "(ii) Set up the Lagrangian for the household. (1) "
  "(iii) Find the optimal condition for the household using the maximisation condition. (3) "
  "(iv) Find the optimal condition from the social planner's perspective. (3)"),

 # ---------------- 2021 final (12th batch) ----------------
 ("q-2021-f-1", "foundations", "final", 2021, "12th", "1", 12.5, "intermediate",
  ["Market failure", "Renewable resources", "Biodiversity"], [2019, 2020, 2013],
  "(A) What do you mean by market failure? What are the sources of market failure? (4.5) "
  "(B) Explain the concepts of renewable resources and non-renewable resources, and also explain the differences "
  "between these two. (4) "
  "(C) What is biological diversity? What is the economic benefit of biological diversity? (4)"),
 ("q-2021-f-2", "coase", "final", 2021, "12th", "2", 12.5, "intermediate",
  ["Coase theorem", "Monopoly", "Resource conservation"], [2020, 2019, 2018],
  "(A) Explain the concept of the Coase theorem and write down its limitations. (6) "
  "(B) Explain that a monopoly firm produces an inefficient level of output for the society, but from a resource "
  "conservation point of view a monopoly firm is good. (6.5)"),
 ("q-2021-f-3", "externalities", "final", 2021, "12th", "3", 12.5, "advanced",
  ["Externalities", "Open access"], [],
  "(A) What is externality? Suppose two firms are located by a river. The first produces steel (located upstream) "
  "and the second (located downstream) operates a resort hotel, and they are owned by separate owners. The steel "
  "factory uses the river as a receptacle for its waste, while the hotel uses the river for attracting customers "
  "seeking water recreation. The steel factory pollutes the water and this badly affects the business of the "
  "resort hotel, which needs unpolluted water. Draw a diagram for the market for steel and show that because of "
  "this negative externality the steel factory produces an inefficient level of steel for the society. (6.5) "
  "(B) What is an 'open-access resource'? Why may this kind of open-access resource lead to overuse? Explain. (6)"),
 ("q-2021-f-4", "valuation", "final", 2021, "12th", "4", 12.5, "intermediate",
  ["Total economic value", "Use and non-use value"], [2018, 2017, 2016, 2014],
  "What is the total economic value (TEV) of an environmental good? What are use values and what are non-use "
  "values? Explain the TEV of a wetland, such as the Hakaluki haor. (12.5)"),
 ("q-2021-f-5", "travelcost", "final", 2021, "12th", "5", 12.5, "intermediate",
  ["Travel cost method", "ITCM"], [2019, 2018, 2017, 2014],
  "What is the travel cost method (TCM)? In which cases do we apply this travel cost method? Discuss how to apply "
  "the individual travel cost method (ITCM). (12.5)"),
 ("q-2021-f-6", "cvm", "final", 2021, "12th", "6", 12.5, "intermediate",
  ["Contingent valuation"], [2020, 2018, 2017, 2013],
  "Explain the concept of the contingent valuation method (CVM). In which cases is the contingent valuation method "
  "applicable? Briefly explain how this CVM method is applied. (12.5)"),
 ("q-2021-f-7", "foundations", "final", 2021, "12th", "7", 12.5, "intermediate",
  ["Environmental quality", "PPC", "Pollutants"], [],
  "(A) What is environmental quality? With the help of production possibility curves (PPC) for current and future "
  "generations (PPC now and PPC 60 years from now, market goods on the vertical axis and environmental quality on "
  "the horizontal axis), show that environmental quality is important for the society. (6.5) "
  "(B) What is a pollutant? Briefly discuss types of pollutants. (6)"),

 # ---------------- 2020 final (11th batch) ----------------
 ("q-2020-f-1", "prisoners", "final", 2020, "11th", "1", 10, "advanced",
  ["Fisher's dilemma", "Open access fishery"], [2019],
  "Describe the Fisher's Dilemma model and explain how open access fishery will give rise to a sub-optimal outcome "
  "in a non-cooperative scenario. (10)"),
 ("q-2020-f-2", "coase", "final", 2020, "11th", "2", 10, "intermediate",
  ["Market failure", "Coase theorem"], [2021, 2019, 2013],
  "(i) Describe the sources of market failure. (5) "
  "(ii) How can bargaining result in an optimal level of externality according to the Coase theorem? (5)"),
 ("q-2020-f-3", "cvm", "final", 2020, "11th", "3", 10, "intermediate",
  ["Contingent valuation", "CVM biases"], [2021, 2018, 2013],
  "Discuss the bias issues of the Contingent Valuation Method. (10)"),
 ("q-2020-f-4", "valuation", "final", 2020, "11th", "4", 5, "beginner",
  ["Benefit transfer"], [2014],
  "Briefly describe the Benefit Transfer Approach of valuing the environment. (5)"),
 ("q-2020-f-5", "welfare", "final", 2020, "11th", "5", 5, "intermediate",
  ["Equivalent variation", "Welfare measurement"], [2016, 2015, 2012],
  "What is Equivalent Variation? Explain graphically. (5)"),
 ("q-2020-f-6", "foundations", "final", 2020, "11th", "6", 5, "beginner",
  ["Ecological economics"], [],
  "Briefly compare Environmental Economics with Ecological Economics. (5)"),
 ("q-2020-f-7", "instruments", "final", 2020, "11th", "7", 5, "advanced",
  ["Least-cost theorem", "Emission targets"], [2019],
  "How will the overall target of emission be shared among many potential polluters according to the Least-Cost "
  "theorem of Pollution Control? (5)"),
 ("q-2020-f-8", "foundations", "final", 2020, "11th", "8", 5, "beginner",
  ["Closed system", "Materials balance"], [2019],
  "Explain the statement: 'Economy and the environment as a closed system'. (5)"),

 # ---------------- 2019 final (10th batch) ----------------
 ("q-2019-f-1", "coase", "final", 2019, "10th", "1", 12.5, "intermediate",
  ["Market failure", "Coase theorem"], [2021, 2020, 2013],
  "What are the principal sources of market failure? Can bargaining between the victim and polluter result in an "
  "optimal outcome? Explain in light of the Coase theorem. (12.5)"),
 ("q-2019-f-2", "targets", "final", 2019, "10th", "2", 12.5, "advanced",
  ["Normative theory", "Pareto optimal pricing", "Depletable externality"], [],
  "(a) Following the normative theory of environmental policy, show that the polluting firm should extend its "
  "waste discharge to the point at which the marginal product of emission is equal to the sum of the marginal "
  "damage imposed on the consumer and the marginal damage imposed on the producer. (6.5) "
  "(b) What are the possible implications of Pareto optimal pricing in the case of depletable and non-depletable "
  "externality? Explain in brief. (6)"),
 ("q-2019-f-3", "travelcost", "final", 2019, "10th", "3", 12.5, "intermediate",
  ["Travel cost method", "ZTCM"], [2021, 2018, 2017, 2014],
  "(a) Briefly describe the theoretical basis of the travel cost method of environmental valuation. (6) "
  "(b) How do we apply this model for empirical estimation? Explain using the concept of the Zonal Travel Cost "
  "model. (6.5)"),
 ("q-2019-f-4", "instruments", "final", 2019, "10th", "4", 12.5, "advanced",
  ["Least-cost theorem", "Limits to growth"], [2020],
  "(a) How will the overall target of emission be shared among many potential polluters according to the Least-Cost "
  "theorem of Pollution Control? (6.5) "
  "(b) Discuss how Limits to Growth will be reached in this world if the growth trend of world population, "
  "industrialization, pollution, food production and resource depletion continues to remain unchanged? (6)"),
 ("q-2019-f-5", "instruments", "final", 2019, "10th", "5", 12.5, "intermediate",
  ["Marketable permits", "IPAT"], [2016, 2015],
  "(a) Discuss the advantages of marketable pollution permits. (10) "
  "(b) Derive the IPAT identity and discuss its three components in short. (2.5)"),
 ("q-2019-f-6", "prisoners", "final", 2019, "10th", "6", 12.5, "advanced",
  ["Prisoner's dilemma", "Fisher's dilemma", "Open access fishery"], [2020],
  "(a) Why are predictions of the Prisoner's Dilemma so important to natural resource management? (2.5) "
  "(b) Describe the Fisher's Dilemma model and explain how open access fishery will give rise to a sub-optimal "
  "outcome in a non-cooperative scenario. (10)"),
 ("q-2019-f-7", "bca", "final", 2019, "10th", "7", 12.5, "intermediate",
  ["Sustainability", "Discounting", "Cost-benefit analysis"], [],
  "Write short notes on the following: (a) Weak and strong sustainability; (b) Choice of discount rate for social "
  "project appraisal; (c) Environmental cost-benefit analysis. (12.5)"),

 # ---------------- 2019 mid (10th batch) ----------------
 ("q-2019-m-1", "limits", "midterm", 2019, "10th", "1", 10, "advanced",
  ["Limits to growth", "Resource depletion"], [2019],
  "(a) Discuss how Limits to Growth will be reached in this world if the growth trend of world population, "
  "industrialization, pollution, food production and resource depletion continues to remain unchanged? (5) "
  "(b) In 1972 the amount of iron reserved in this world was 575 million metric tons, from which 1.2 million "
  "metric tons were mined annually. The rate of iron consumption was growing at a rate of 3 percent annually. "
  "According to the limits to growth theorem, how long would iron last in this world? (5)"),
 ("q-2019-m-2", "limits", "midterm", 2019, "10th", "2", 10, "intermediate",
  ["Environmental Kuznets Curve"], [2015, 2012],
  "(a) Discuss the relationship between income and environmental degradation using the Environmental Kuznets Curve "
  "hypothesis. (5) "
  "(b) Why does the EKC take an inverted U shape? Do you think this hypothesis is valid for all types of "
  "pollutants? Give your reasoning. (5)"),
 ("q-2019-m-3", "instruments", "midterm", 2019, "10th", "3", 10, "advanced",
  ["Instrument choice", "Least-cost theorem"], [2020, 2019],
  "(a) What are the criteria for selecting pollution control instruments? Should the weights for all types of "
  "criteria be the same? Give your arguments. (5) "
  "(b) How will the overall target of emission be shared among so many potential polluters? Discuss using the "
  "Least-Cost theorem of Pollution Control. (5)"),
 ("q-2019-m-4", "foundations", "midterm", 2019, "10th", "4", 10, "intermediate",
  ["Limits to growth", "Thermodynamics", "Closed system"], [2020],
  "Write short notes on the following topics (any two): (a) Social Limits to Growth; (b) Laws of Thermodynamics; "
  "(c) Economy and the environment as a closed system. (5+5)"),

 # ---------------- 2018 final (9th batch) ----------------
 ("q-2018-f-1", "sustainability", "final", 2018, "9th", "1", 12.5, "intermediate",
  ["Thermodynamics", "Sustainability", "Daly's principles"], [2017, 2015, 2010],
  "(a) What are the economic implications of environmental resources? Why do environmental resources need special "
  "attention? (3.5) "
  "(b) State the laws of thermodynamics. 'The entire nature of the economic system is entropic' — explain. (3) "
  "(c) What are the key pillars of sustainability? Explain in brief. (3) "
  "(d) Discuss Daly's principles of sustainability. (3)"),
 ("q-2018-f-2", "coase", "final", 2018, "9th", "2", 12.5, "advanced",
  ["Coase theorem", "Pigovian fee", "Market power"], [2021, 2017, 2014],
  "(a) 'The Coase Theorem suggests that it makes no difference whether the polluter must compensate the victim of "
  "the pollution or the victim must pay the polluter not to pollute' — justify the statement in terms of "
  "efficiency. (4.5) "
  "(b) Briefly explain the concept of the Pigovian fee. Explain that the Pigovian fee makes the situation worse "
  "when there is market power. Consider the case of a monopolist in the goods market. (4) "
  "(c) Suppose Karim and Rahim are two neighbours. Karim generates a lot of garbage and throws it over the fence "
  "of Rahim. Explain that if Karim and Rahim can talk with each other costlessly and arrive at some solution, and "
  "if we consider both the consumer and producer side of this problem, then there will not be any conflict between "
  "the Coasian and Pigovian solutions. (4)"),
 ("q-2018-f-3", "targets", "final", 2018, "9th", "3", 12.5, "advanced",
  ["Regulatory instruments", "Stock and flow pollutants"], [],
  "(a) Briefly discuss various regulatory instruments of pollution control. (8) "
  "(b) Define stock pollutant and flow pollutant. Explain the rule for the efficient amount of emission in the "
  "case of a stock pollutant. (4.5)"),
 ("q-2018-f-4", "uncertainty", "final", 2018, "9th", "4", 12.5, "advanced",
  ["Transfer coefficient", "Ambient permits", "Uncertainty"], [2017],
  "(a) Explain the concept of transfer coefficient. Suppose a number of firms generate emissions that lead to "
  "ambient concentration of pollution. The ambient pollution level is observable but not the emission level of "
  "individuals. Propose a regulatory mechanism that would be efficient in this situation. (7.5) "
  "(b) Consider the problem in which the EPA is uncertain about the pollution control cost of firms. Illustrate a "
  "regulatory design that will minimise expected social cost, i.e. expected pollution control cost plus pollution "
  "damage. (5)"),
 ("q-2018-f-5", "valuation", "final", 2018, "9th", "5", 12.5, "intermediate",
  ["Total economic value", "Revealed and stated preference", "ITCM", "CVM biases"], [2021, 2017, 2016, 2014],
  "(a) What do you mean by total economic value of environmental goods? Distinguish between revealed preference "
  "and stated preference methods of economic valuation. (4) "
  "(b) What is a trip generating function? Give the theoretical justification for using the individual travel cost "
  "method (ITCM). (4.5) "
  "(c) Briefly explain the concept of the contingent valuation method (CVM). Discuss the bias issues in CVM. (4)"),
 ("q-2018-f-6", "sdg", "final", 2018, "9th", "6", 12.5, "intermediate",
  ["Sustainability measurement", "SDG", "Choice experiment"], [],
  "Write short notes on: (i) Measures of sustainability; (ii) SDG; (iii) Choice experiment. (3+4.5+5)"),

 # ---------------- 2017 final (8th batch) ----------------
 ("q-2017-f-1", "sustainability", "final", 2017, "8th", "1", 12.5, "intermediate",
  ["Economy-environment linkage", "Thermodynamics", "Hartwick rule"], [2018, 2015, 2010],
  "(A) Explain the linkage between environment and economy in brief. (3) "
  "(B) Explain the relationship between economic production and the laws of thermodynamics. (2.5) "
  "(C) What is sustainable development? Critically examine the Hartwick model of sustainability. (3) "
  "(D) How can we measure sustainability? Discuss in brief. (4)"),
 ("q-2017-f-2", "coase", "final", 2017, "8th", "2", 12.5, "advanced",
  ["Market failure", "Property rights", "Coase theorem"], [2011],
  "(A) List out reasons and possible solutions to market failure. Suppose a steel mill and a laundry are "
  "neighbours. The steel mill produces steel and pollution and the laundry produces clean clothes with clean air. "
  "Without any property right the market output is inefficient. Derive the efficiency condition and comment on the "
  "result in the following situations: (i) the steel mill owns the laundry; (ii) only the steel mill has the right "
  "to pollute; (iii) the laundry has the right to clean air. (9.5) "
  "(B) What are the problems of the Coasian solution to a public bad when there are large numbers of victims? "
  "Explain in brief with an example. (3)"),
 ("q-2017-f-3", "targets", "final", 2017, "8th", "3", 12.5, "advanced",
  ["Pigovian fee", "Market power", "Optimal pollution"], [2018],
  "(A) Explain that the Pigovian fee makes the situation worse when there is market power. Consider the case of a "
  "monopolist in the bad's production. (5) "
  "(B) Assume an economy of two firms who are polluters and two consumers. The marginal savings and marginal "
  "damage functions are: MS₁(e₁) = 5 − e₁ where e₁ is emission from firm 1; MS₂(e₂) = 5 − e₂ where e₂ is emission "
  "from firm 2; MD₁(e) = MD₂(e) = e, where e is the total amount of emission the consumer is exposed to. "
  "(i) Graph the firm-level, aggregate marginal savings and aggregate marginal damage functions. "
  "(ii) What is the optimal level of pollution, the appropriate Pigovian fee and emission from each firm? (7.5)"),
 ("q-2017-f-4", "uncertainty", "final", 2017, "8th", "4", 12.5, "advanced",
  ["Transfer coefficient", "Marketable ambient permits", "Prices vs quantities"], [2018],
  "(A) Explain the concept of transfer coefficient and marketable ambient permits. Consider a river with two "
  "factories f₁ and f₂ with transfer coefficients a₁ and a₂ discharging organic waste into it. Derive the "
  "condition for the efficient amount of pollution and emission. How should the emission fee be structured to "
  "yield efficiency? (6) "
  "(B) Which regulatory system, price or quantity, would you prefer when there is uncertainty about the firm's "
  "marginal savings? Justify your answer. (6.5)"),
 ("q-2017-f-5", "valuation", "final", 2017, "8th", "5", 12.5, "intermediate",
  ["Total economic value", "Revealed and stated preference", "Travel cost method"], [2021, 2018, 2016, 2014],
  "(A) What do you mean by economic value? Discuss the concept of total economic value. (4) "
  "(B) What is the importance of economic valuation? Distinguish between revealed preference and stated preference "
  "methods of economic valuation. (3) "
  "(C) Suppose you want to estimate the recreational value of the Dhaka Zoo. Which method of valuation would you "
  "prefer? Briefly discuss each step of this method. What is the strength of this method? (5.5)"),
 ("q-2017-f-6", "cvm", "final", 2017, "8th", "6", 12.5, "advanced",
  ["Contingent valuation", "NOAA panel", "Mean WTP"], [2020, 2018, 2013],
  "(A) Discuss the strengths and weaknesses of the Contingent Valuation Method (CVM) as a valuation method. (4) "
  "(B) List out the general guidelines of the Blue Ribbon NOAA Panel (1993) for a CV study. What are the commonly "
  "used value-eliciting formats in a CV study? Discuss. (4) "
  "(C) Consider the following estimated model: WTP = 0.8103 − 0.00643·Bid, where WTP is a dichotomous 'yes/no' "
  "response to the offered bid amount and Bid is the amount offered to the respondent. Find the mean willingness "
  "to pay (MWTP). Also find the aggregate WTP if the number of respondents is 328,973, of which 13.2% is protest "
  "bid. (4.5)"),

 # ---------------- 2016 final (7th batch) ----------------
 ("q-2016-f-1", "sustainability", "final", 2016, "7th", "1", 12.5, "intermediate",
  ["Sustainability", "Sustainable development"], [2015, 2013, 2011],
  "(a) Define sustainability and explain the importance of this concept relative to environmental policy. (5.5) "
  "(b) What are some of the main strategies suggested by mainstream interpretations of 'sustainable development' "
  "for addressing environmental problems? (7)"),
 ("q-2016-f-2", "ethics", "final", 2016, "7th", "2", 12.5, "advanced",
  ["Utilitarianism", "Rawlsian criterion", "Discount rate"], [2014],
  "(a) What is meant by Utilitarianism? What is the distributional implication of a utilitarian social welfare "
  "function? (4) "
  "(b) What is the Rawlsian max-min criterion? Is it an appropriate criterion for intergenerational decisions in "
  "the field of environmental and resource economics? (4.5) "
  "(c) What should be the role of policy makers in resolving a conflict between pure time preference and the "
  "irreversibility issue in determining a discount rate? (4)"),
 ("q-2016-f-3", "welfare", "final", 2016, "7th", "3", 12.5, "advanced",
  ["WTP vs WTA", "Compensating variation", "Equivalent variation"], [2020, 2015, 2013, 2012, 2011],
  "(a) What is the distinction between 'willingness to pay' versus 'willingness to accept payment' in relation to "
  "some given change in environmental quality? What are the considerations in choosing between the two measures? "
  "(5.5) "
  "(b) Show how the concepts of equivalent and compensating variation can be derived for price and quantity "
  "change. (7)"),
 ("q-2016-f-4", "instruments", "final", 2016, "7th", "4", 12.5, "advanced",
  ["Depletable externality", "Taxes vs subsidies"], [2015, 2012, 2010],
  "(a) Explain why it is not necessary to tax or subsidise victims of pollution to induce them to undertake the "
  "optimal level of preventative activity when externalities are depletable and undepletable in nature. (4.5) "
  "(b) Considering both short-run and long-run views, compare and contrast the outcome of taxes and subsidies as "
  "instruments for pollution control for firms and industry. (8)"),
 ("q-2016-f-5", "valuation", "final", 2016, "7th", "5", 12.5, "intermediate",
  ["Revealed and stated preference", "Water quality valuation"], [2018, 2017, 2014],
  "(a) Distinguish between revealed preference and stated preference techniques for environmental valuation. (3.5) "
  "(b) Explain how one of the techniques could be used to value a decline in water quality. What are the "
  "advantages and disadvantages of the technique in this context? (9)"),
 ("q-2016-f-6", "valuation", "final", 2016, "7th", "6", 12.5, "intermediate",
  ["Hedonic pricing", "Hedonic wage"], [2014],
  "Why is it possible to look at wages and housing prices to draw a conclusion about the value of environmental "
  "quality? (12.5)"),
 ("q-2016-f-7", "instruments", "final", 2016, "7th", "7", 12.5, "intermediate",
  ["Marketable permits", "Total economic value", "Conjoint analysis"], [2019, 2015, 2014],
  "Write short notes on: (a) Marketable Pollution Permits; (b) Total Economic Value; (c) Conjoint Analysis. "
  "(4.5+4.5+3.5)"),

 # ---------------- 2015 final (6th batch) ----------------
 ("q-2015-f-1", "sustainability", "final", 2015, "6th", "1", 12.5, "intermediate",
  ["Sustainable development", "Thermodynamics"], [2016, 2013, 2011],
  "(a) What are some of the main strategies suggested by mainstream interpretations of 'sustainable development' "
  "for addressing environmental problems? (8) "
  "(b) Discuss the relevance of the first and second laws of thermodynamics in relation to the services provided "
  "by the environment. (4.5)"),
 ("q-2015-f-2", "limits", "final", 2015, "6th", "2", 12.5, "intermediate",
  ["Environmental Kuznets Curve"], [2019, 2012],
  "(a) What is the 'Environmental Kuznets Curve (EKC)'? (3) "
  "(b) Critically examine the validity of the EKC hypothesis as an instrument for examining the relationship "
  "between economic growth and environmental changes. (9.5)"),
 ("q-2015-f-3", "welfare", "final", 2015, "6th", "3", 12.5, "advanced",
  ["Compensating variation", "Equivalent variation", "WTP vs WTA"], [2020, 2016, 2012],
  "(a) Graphically analyse compensating variation and equivalent variation as welfare measures for evaluating any "
  "environmental change. (8) "
  "(b) Does economic theory help us to understand why willingness to pay and accept often differ substantially in "
  "empirical studies relating to environmental resources? (4.5)"),
 ("q-2015-f-4", "ethics", "final", 2015, "6th", "4", 12.5, "intermediate",
  ["Discounting"], [2013, 2010],
  "(a) Why do we discount the future? (7) "
  "(b) How might the alleged environmental implications of discounting be ameliorated? (5.5)"),
 ("q-2015-f-5", "instruments", "final", 2015, "6th", "5", 12.5, "advanced",
  ["Undepletable externality", "Pareto optimal tax", "Imperfect competition"], [2016, 2012, 2010],
  "(a) Consider a perfectly competitive economy and the presence of an undepletable externality. What type of tax "
  "structure can sustain a competitive equilibrium that is Pareto-optimal? (8) "
  "(b) Discuss the problems of applying the same remedial measure under imperfect competition. (4.5)"),
 ("q-2015-f-6", "cvm", "final", 2015, "6th", "6", 12.5, "intermediate",
  ["Contingent valuation"], [2013],
  "(a) Explain why mainstream economists have been somewhat reluctant to embrace contingent valuation methods as a "
  "technique for determining the social benefits from environmental improvements. (9) "
  "(b) Why, therefore, do environmental economists rely on these techniques in some cases? Explain. (3.5)"),
 ("q-2015-f-7", "instruments", "final", 2015, "6th", "7", 12.5, "intermediate",
  ["Environmental justice", "Marketable permits", "Deposit refund", "Hedonic wage"], [2016, 2014, 2011],
  "Write short notes on any two: (a) Relationship between Utilitarianism and Environmental Justice; "
  "(b) Marketable Pollution Permits; (c) Deposit Refund System; (d) Hedonic Wage Method. (6.25+6.25)"),

 # ---------------- 2014 final (5th batch) ----------------
 ("q-2014-f-1", "sustainability", "final", 2014, "5th", "1", 12.5, "intermediate",
  ["Sustainable development", "Weak and strong sustainability"], [2012],
  "(a) Why is sustainable development so often associated with protecting the environment? (5) "
  "(b) Provide a specific example of how the weak and strong definitions of sustainability might be applied in a "
  "discussion of economic development alternatives. (7.5)"),
 ("q-2014-f-2", "ethics", "final", 2014, "5th", "2", 12.5, "advanced",
  ["Libertarian ethics", "Rawls", "Discount rate"], [2016, 2011],
  "(a) How would the issue relating to unjust holding be dealt with under libertarian ethics? (4) "
  "(b) Discuss the implications of Rawls's Difference Principle for a morally just distribution of resources "
  "within and between countries. (4) "
  "(c) What is the relationship between the utility discount rate and the consumption discount rate? (4.5)"),
 ("q-2014-f-3", "uncertainty", "final", 2014, "5th", "3", 12.5, "advanced",
  ["Adverse selection", "Asymmetric information", "Subsidies"], [2012, 2010],
  "(a) Asymmetric information typically involves the regulator having less relevant information than the regulated "
  "parties. Find out what is meant by 'adverse selection' and show why it can lead to asymmetric information. "
  "(3.5) "
  "(b) Why does adverse selection make it difficult to regulate pollution efficiently? (3.5) "
  "(c) Demonstrate, highlighting any important assumptions made, that subsidies which reward reduced emissions by "
  "the firm tend to increase pollution by the industry. (5.5)"),
 ("q-2014-f-4", "coase", "final", 2014, "5th", "4", 12.5, "advanced",
  ["Coase theorem", "Assumptions"], [2021, 2018, 2010],
  "(a) What are the assumptions required for the Coase Theorem to hold? (4.5) "
  "(b) Explain how and why the theorem may break down when these assumptions do not hold. (4) "
  "(c) Which of the assumptions are, in your view, the most serious limitations on the applicability of the "
  "theorem to environmental problems? (4)"),
 ("q-2014-f-5", "valuation", "final", 2014, "5th", "5", 12.5, "intermediate",
  ["Hedonic pricing"], [2016],
  "Why is it possible to look at wages and housing prices to draw a conclusion about the value of environmental "
  "quality? (12.5)"),
 ("q-2014-f-6", "travelcost", "final", 2014, "5th", "6", 12.5, "intermediate",
  ["Revealed and stated preference", "Travel cost method"], [2021, 2019, 2018, 2017, 2016],
  "(a) Distinguish between revealed preference and stated preference techniques for environmental valuation. (2) "
  "(b) Provide a description of the use of the Travel Cost method for valuing environmental quality. (6) "
  "(c) Discuss the relevance of the following issues to this valuation procedure: (i) Time and (ii) Specification "
  "and Estimation problems. (4.5)"),
 ("q-2014-f-7", "valuation", "final", 2014, "5th", "7", 12.5, "intermediate",
  ["Standard setting", "Total economic value", "Benefit transfer"], [2020, 2016],
  "Write short notes on: (a) Inefficiency of Standard-Setting; (b) Total Economic Value; (c) Benefit Transfer "
  "Approach. (4+4.5+4)"),

 # ---------------- 2013 final (4th batch) ----------------
 ("q-2013-f-1", "sustainability", "final", 2013, "4th", "1", 12.5, "intermediate",
  ["Sustainable development", "Developing countries"], [2016, 2015, 2011],
  "(a) What are some of the main strategies suggested by mainstream interpretations of 'sustainable development' "
  "for addressing environmental problems? (6) "
  "(b) What practical relevance does the concept of 'sustainable development' have for developing countries with "
  "regard to environmental policy making? (6.5)"),
 ("q-2013-f-2", "ethics", "final", 2013, "4th", "2", 12.5, "intermediate",
  ["Discounting", "Tyranny of discounting"], [2015, 2010],
  "(a) Why do environmentalists refer to the 'tyranny of discounting'? (5) "
  "(b) How might the alleged environmental implications of discounting be ameliorated? (7.5)"),
 ("q-2013-f-3", "externalities", "final", 2013, "4th", "3", 12.5, "intermediate",
  ["Market failure", "Command and control", "Economic instruments"], [2021, 2020, 2019, 2011],
  "(a) What is a market failure? Give an example of an environmental market failure. (4) "
  "(b) Would you like to address the issue using conventional command and control regulation or economic "
  "instruments or both? (8.5)"),
 ("q-2013-f-4", "targets", "final", 2013, "4th", "4", 12.5, "advanced",
  ["Pigouvian tax", "Public bad", "Victim taxation"], [],
  "(a) Justify the statement: 'Pollution is a public bad and the proper corrective device for it is a Pigouvian "
  "tax equal to marginal social damage on the source of emission and no supplementary incentive for the victim'. "
  "(8) "
  "(b) When should the victim be subject to taxation to reach the optimal social outcome? (4.5)"),
 ("q-2013-f-5", "welfare", "final", 2013, "4th", "5", 12.5, "intermediate",
  ["WTP vs WTA", "Welfare measurement"], [2016, 2011],
  "(a) What are the theoretical underpinnings of measures of welfare referred to as 'willingness to pay' and "
  "'willingness to accept'? (7) "
  "(b) How adequate are these theoretical foundations for measuring changes in welfare arising from environmental "
  "impacts? (5.5)"),
 ("q-2013-f-6", "cvm", "final", 2013, "4th", "6", 12.5, "advanced",
  ["Contingent valuation", "CVM biases"], [2020, 2018, 2017],
  "(a) In the use of contingent valuation a number of biases have been identified. What are these biases, how "
  "serious a problem do they pose and how can they be corrected? (8.5) "
  "(b) Give empirical examples of the points you make wherever possible. (4)"),
 ("q-2013-f-7", "valuation", "final", 2013, "4th", "7", 12.5, "advanced",
  ["Revealed preference", "Defensive expenditure", "Noise"], [],
  "(a) What are the primary advantages and disadvantages of revealed-preference valuation methods over other "
  "methods? (3) "
  "(b) Discuss the use of the defensive expenditure approach to deal with the problems associated with external "
  "noises. (9.5)"),

 # ---------------- 2012 final (3rd batch) ----------------
 ("q-2012-f-1", "sustainability", "final", 2012, "3rd", "1", 12.5, "intermediate",
  ["Sustainable development", "Weak and strong sustainability"], [2014],
  "(a) Why is sustainable development so often associated with protecting the environment? (5) "
  "(b) Provide a specific example of how the weak and strong definitions of sustainability might be applied in a "
  "discussion of economic development alternatives. (7.5)"),
 ("q-2012-f-2", "limits", "final", 2012, "3rd", "2", 12.5, "intermediate",
  ["Environmental Kuznets Curve"], [2019, 2015],
  "(a) What is the 'Environmental Kuznets curve (EKC)'? (3) "
  "(b) Critically examine the validity of the EKC hypothesis as an instrument for examining the relationship "
  "between economic growth and environmental changes. (9.5)"),
 ("q-2012-f-3", "welfare", "final", 2012, "3rd", "3", 12.5, "advanced",
  ["Compensating variation", "Equivalent variation", "WTP vs WTA"], [2016, 2015],
  "(a) Show how the concepts of equivalent and compensating variations can be derived for price and "
  "quantity/quality changes. (8) "
  "(b) Does economic theory help us to understand why willingness to pay and accept often differ substantially in "
  "empirical studies relating to environmental resources? (4.5)"),
 ("q-2012-f-4", "instruments", "final", 2012, "3rd", "4", 12.5, "advanced",
  ["Taxes vs subsidies", "Adverse selection"], [2016, 2014],
  "(a) Considering both short-run and long-run views, compare and contrast the outcome of taxes and subsidies as "
  "instruments for pollution control. (9) "
  "(b) Why does adverse selection make it difficult to regulate pollution efficiently? (3.5)"),
 ("q-2012-f-5", "instruments", "final", 2012, "3rd", "5", 12.5, "advanced",
  ["Undepletable externality", "Pareto optimal tax", "Imperfect competition"], [2015, 2010],
  "(a) Consider a perfectly competitive economy and the presence of an undepletable externality. What type of tax "
  "structure can sustain a competitive equilibrium that is Pareto-optimal? (8) "
  "(b) Discuss the problems of applying the same remedial measure under imperfect competition. (4.5)"),
 ("q-2012-f-6", "sdg", "final", 2012, "3rd", "6", 12.5, "beginner",
  ["Environmental communication"], [],
  "Suppose you work for an environmental group that puts out a monthly newsletter. You have been assigned to write "
  "an article on 'The Clean Environment: A Global Challenge'. Describe the types of information you would include "
  "in your article. (12.5)"),

 # ---------------- 2011 final (2nd batch) ----------------
 ("q-2011-f-1", "sustainability", "final", 2011, "2nd", "1", 12.5, "intermediate",
  ["Sustainable development"], [2016, 2015, 2013],
  "What are some of the main strategies suggested by mainstream interpretations of 'sustainable development' for "
  "addressing environmental problems? (12.5)"),
 ("q-2011-f-2", "ethics", "final", 2011, "2nd", "2", 12.5, "advanced",
  ["Discount rate", "Welfare maximum"], [2014],
  "How is the utility discount rate related to the consumption discount rate? Demonstrate that an unequal "
  "distribution of goods at a welfare maximum may occur when the weights attached to individual utilities are not "
  "equal, and/or when individuals have different utility functions. (12.5)"),
 ("q-2011-f-3", "welfare", "final", 2011, "2nd", "3", 12.5, "intermediate",
  ["WTP vs WTA"], [2016, 2013],
  "Consider some given change in environmental quantity. What is the distinction between 'willingness to pay' and "
  "'willingness to accept' in relation to the change? What are the considerations in choosing between the two "
  "measures? (12.5)"),
 ("q-2011-f-4", "instruments", "final", 2011, "2nd", "4", 12.5, "intermediate",
  ["Command and control", "Emissions taxes", "Emissions trading"], [2013],
  "Assess the relative strengths and weaknesses of (i) conventional command and control regulation and "
  "(ii) economic instruments such as emissions taxes and emissions trading in the regulation of industrial "
  "pollution. (12.5)"),
 ("q-2011-f-5", "coase", "final", 2011, "2nd", "5", 12.5, "advanced",
  ["Coase theorem", "Bargaining range"], [2017],
  "Consider an air pollution externality arising from the operation of a coal-fired foundry located next door to a "
  "laundry. The smoke from the foundry adversely affects the operation of the laundry by increasing its unit costs "
  "per item of clothing cleaned. The increase in laundry costs could be reduced by restricting the number of hours "
  "the foundry operates, from the current level of 24 hours per day. "
  "(i) Draw and explain a diagram to show the efficient resolution of the conflict between the foundry and the "
  "laundry. "
  "(ii) Using your diagram, explain the range of possible efficient bargains that could be reached if the legal "
  "context is one in which the generator of the externality faces no legal restriction on emissions. "
  "(iii) If instead the law gives the laundry the right to an unpolluted environment, what is the range of "
  "possible bargains that the foundry could offer the laundry? "
  "(iv) In each case, identify the precise quantitative limits (in terms of areas on your graph) on the range of "
  "possible bargains. (12.5)"),
 ("q-2011-f-6", "instruments", "final", 2011, "2nd", "6", 12.5, "beginner",
  ["Deposit refund system"], [2015],
  "What is a deposit-refund system? What types of environmental problems are best handled with deposit-refund "
  "systems? Discuss. (12.5)"),

 # ---------------- 2010 final (1st batch) ----------------
 ("q-2010-f-1", "foundations", "final", 2010, "1st", "I.1", 6, "intermediate",
  ["Scarcity", "Environmental services"], [],
  "'All natural resource endowment as well as environmental services must be interpreted as scarce resources.' "
  "Do you support this argument? Why / why not? (6)"),
 ("q-2010-f-2", "foundations", "final", 2010, "1st", "I.2", 6, "intermediate",
  ["Thermodynamics"], [2018, 2017, 2015],
  "Discuss the relevance of the first and the second law of thermodynamics in relation to the services provided by "
  "the environment. (6)"),
 ("q-2010-f-3", "sustainability", "final", 2010, "1st", "I.3", 6, "intermediate",
  ["Sustainability", "Optimists vs pessimists"], [],
  "What are the elements of the debate between optimists and pessimists over the sustainability issue? (6)"),
 ("q-2010-f-4", "coase", "final", 2010, "1st", "I.4", 6, "intermediate",
  ["Coase theorem", "Large numbers"], [2017, 2014],
  "'The Coase solution to externalities works if and only if the number of people involved is small.' Discuss. (6)"),
 ("q-2010-f-5", "instruments", "final", 2010, "1st", "I.5", 6, "advanced",
  ["Subsidies", "Industry entry"], [2014],
  "Demonstrate, highlighting any important assumptions made, that subsidies which reward reduced emissions by the "
  "firm tend to increase pollution by the industry. (6)"),
 ("q-2010-f-6", "ethics", "final", 2010, "1st", "II.1", 16, "advanced",
  ["Discounting", "Intergenerational welfare"], [2015, 2013],
  "Why do we discount the future? What considerations are relevant to setting a discount rate to deal with "
  "developments that affect environment and intergenerational welfare? (16)"),
 ("q-2010-f-7", "welfare", "final", 2010, "1st", "II.2", 16, "advanced",
  ["WTP vs WTA"], [2016, 2013, 2011],
  "What are the theoretical underpinnings of measures of welfare referred to as 'willingness to pay' and "
  "'willingness to accept'? Does economic theory help us to understand why willingness to pay and willingness to "
  "accept often differ substantially in empirical studies relating to environmental resources? (16)"),
 ("q-2010-f-8", "instruments", "final", 2010, "1st", "II.3", 16, "advanced",
  ["Undepletable externality", "Pareto optimal tax", "Imperfect competition"], [2015, 2012],
  "Consider a perfectly competitive economy and the presence of an undepletable externality. What type of tax "
  "structure can sustain a competitive equilibrium that is Pareto-optimal? Discuss the problems of applying the "
  "similar regulatory instrument/s under imperfect competition for a Pareto efficient outcome. (16)"),
]

ACCOUNTING_SHORTS = [
    "What is the difference between water statistics and water accounting?",
    "What are the sources of water supply?",
    "What is a physical supply and use table?",
    "What are the main components of a system of environmental accounts?",
    "What are the sources of atmospheric water resources?",
    "What is the objective of SEEA water accounting?",
    "What is an asset account and a flow account?",
    "What are the components of a supply and use table?",
    "What is a water satellite account?",
    "Describe the necessity of SEEA accounting. Why is SNA not enough?",
    "How is water accounting related to environment and economy?",
    "Compile a physical supply and use table for oil resources.",
    "What is the difference between soil water and ground water?",
    "Why should we do energy accounts?",
    "What is the objective of an energy account?",
    "How did the concept of sustainability emerge?",
    "Explain: energy as a product, energy as residual.",
]
# These are a compiled "likely short questions" list, not a sat paper — hence
# examType "practice", no year and no marks. Nothing here should be read as
# something that actually appeared in an exam.
for i, text in enumerate(ACCOUNTING_SHORTS, 1):
    Q.append((f"q-acct-{i:02d}", "accounting", "practice", None, "97th", f"S{i}", None,
              "beginner", ["Environmental accounting"], [], text))

questions = [{
    "id": q[0], "chapterId": q[1], "examType": q[2], "year": q[3], "batch": q[4],
    "qNo": q[5], "marks": q[6], "difficulty": q[7], "topics": q[8], "repeats": q[9],
    "theoryIds": [], "text": q[10], "answerPoints": [], "answer": "", "answerBn": "",
} for q in Q]

course = {
    "id": "env-econ",
    "code": "ECON 409",
    "title": "Environmental Economics",
    "titleBn": "পরিবেশ অর্থনীতি",
    "color": "#5ac8fa",
    "credits": 4,
    "semester": 7,
    "description":
        "Built from the **409 Environmental Economics** Drive folder: the chapter spine comes from the "
        "*97th syllabus* note, and the question bank is every past paper in *Previous Years/Questions* — "
        "**15 papers spanning 2010–2022**.\n\n"
        "> **Transcription warning.** Every question here was read off a scan or a photograph. The wording is "
        "faithful, but check equations and numbers against the original image before you rely on them — a few "
        "were reconstructed from imperfect OCR (they are the ones with algebra in them).\n\n"
        "> **No model answers yet.** The bank is complete; the answers are the next job. Ask Claude for them "
        "chapter by chapter — start with the topics carrying the most `↻ repeated` badges.\n\n"
        "> The seventeen **Environmental Accounting** items are tagged *Practice / anticipated* rather than given "
        "a year: they come from a compiled 'likely short questions' list in the Drive, not from a sat paper. "
        "Filter them out with the Exam-type filter when you want real past questions only.\n\n"
        "The 97th-batch syllabus is narrower than the historical papers. Chapters it names are marked "
        "*'On the 97th-batch syllabus'* in the map below; the rest are there because they recur in the archive. "
        "**Confirm your own batch's syllabus before trusting the split.**",

    "examPattern": {
        "durationMin": 180,
        "notes":
            "The final has been stable for over a decade: **50 marks, 3 hours, answer any four of six or seven "
            "questions at 12.5 marks each** (2011–2019, 2021). Two departures worth knowing:\n\n"
            "- **2010** ran a two-part paper — Part I: any three of five at 6 marks; Part II: any two of three at "
            "16 marks; 2 hours 40 minutes.\n"
            "- **2020** was shortened to 25 marks in 90 minutes — Section A: one of three at 10; Section B: three "
            "of five at 5.\n\n"
            "Mid-term is 30 marks in 90 minutes (2019: any three of four at 10; 2022: all three at 10). "
            "The in-course is 15 marks in one hour.",
        "sections": [
            {"name": "Answer any four", "answer": 4, "outOf": 7, "marks": 12.5},
        ],
    },

    "chapters": [
        {"id": cid, "no": no, "title": title, "titleBn": bn, "ref": ref, "summary": summary}
        for cid, no, title, bn, ref, summary in chapters
    ],

    "textbooks": [
        {"id": "tb-perman", "title": "Natural Resource and Environmental Economics",
         "author": "Roger Perman, Yue Ma, James McGilvray & Michael Common",
         "edition": "4th", "year": 2011, "prescribed": True,
         "chaptersCovered": "Ch. 5 (welfare, to 5.3), Ch. 6 (targets, to 6.11), Ch. 7 (instruments, to p. 205)",
         "notes": "**Inferred, not stated.** The syllabus note refers to *'Chapter 5: Welfare Economics and "
                  "environment'*, *'Pollution Control: Targets (up to 6.11)'* and *'pollution control instrument "
                  "up to page 205'* — that chapter and section numbering matches Perman et al. exactly. Confirm "
                  "with your instructor, then set the page limits against your own copy.",
         "file": "", "url": ""},
        {"id": "tb-classpdf", "title": "Course PDFs and slide decks", "author": "Course instructors",
         "edition": "", "year": None, "prescribed": True,
         "chaptersCovered": "Externalities (to p. 7), solid waste (to 6.3), benefit–cost (to p. 6), travel cost (to slide 23)",
         "notes": "Several syllabus limits are given as page numbers in a distributed PDF rather than a textbook. "
                  "The Drive folder has **Class Notes**, **Lecture Materials** and **Ebooks** subfolders that were "
                  "not imported — download what you need and drop it in `content/files/`.",
         "file": "", "url": "https://drive.google.com/drive/folders/1Aevcq2-fAQDH5cnqgEmtGht5FCxtGxxb"},
    ],

    "theories": [],
    "questions": questions,
    "exercises": [],
    "notes": [
        {"id": "n-syllabus-97", "chapterId": "externalities",
         "title": "97th batch syllabus — as circulated", "date": "2023-03-02",
         "source": "Syllabus note (97th syllabus course.png)", "theoryIds": [], "tags": ["syllabus"], "file": "",
         "body":
            "Transcribed from the syllabus screenshot in the Drive folder. Page limits are as written.\n\n"
            "## Before mid\n\n"
            "1. **Externalities** — up to page 7 of the pdf\n"
            "2. **Nudging for clean air** — watch the mid question and the sheet, in full\n"
            "3. **Tragedy of the Commons** — full\n"
            "4. **Prisoner's Dilemma** — full\n"
            "5. **Chapter 5: Welfare Economics and the Environment** — up to 5.3 (page 9 of the pdf)\n"
            "6. **Pollution Control: Targets** — up to 6.11 (page 25 of the pdf)\n\n"
            "## After mid\n\n"
            "1. **Pollution control instruments** — up to page 205\n"
            "2. **Solid waste management** (classroom) — up to topic 6.3 (page 15 of the pdf)\n"
            "3. **Benefit–cost analysis** (classroom) — up to page 6, up to materials damage\n"
            "4. **SDG and Bangladesh** — no reference given\n"
            "5. **Travel cost** — up to slide 23\n"
            "6. **Sound pollution and willingness to pay** — from the class of 2 March 2023. The note says the "
            "reference *may* be the introduction to Contingent Valuation, and advises reading the class lecture "
            "to stay on the safe side.\n"
            "7. **Contingent Valuation** — full\n\n"
            "> This is the **97th batch's** list. Check it against your own batch's before you plan revision "
            "around it — the historical papers range far wider than these thirteen items."},
    ],
}

dest = ROOT / "content/courses/env-econ.json"
dest.write_text(json.dumps(course, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

years = sorted({q["year"] for q in questions if q["year"]})
print(f"wrote {dest.name}")
print(f"  {len(course['chapters'])} chapters, {len(questions)} questions, {len(course['notes'])} notes")
print(f"  years: {years}")
print(f"  repeated questions: {sum(1 for q in questions if q['repeats'])}")
