// Control: GetDesignerRecommendationsController
// Feature: Get Designer Recommendations (Customer) - the recommendation algorithm
//
// What goes here:
// 1. Style weighting from likes: for each category (style) the customer liked,
//    weight = likes in that category / total likes.
// 2. Scoring: for each verified designer, score = sum of the weights of the categories
//    of their IDPs (optionally boosted by the designer's total likes).
// 3. Ranking: sort designers by score, highest first; return the top MAX_RECOMMENDATIONS.
// 4. Cold start fallback: if the customer has fewer than MIN_LIKES_FOR_RECOMMENDATION likes,
//    return the most-liked verified designers instead.
//
// Constants:
// - MAX_RECOMMENDATIONS (e.g. 5)
// - MIN_LIKES_FOR_RECOMMENDATION (e.g. 3)
//
// Methods:
// - getRecommendations(customerID)
//     -> IDPLike.getLikesByCustomer(customerID)
//     -> IDP.getIDP(idpID) for each liked IDP
// - calculateStyleWeights(likedIDPs)
// - calculateDesignerScore(styleWeights, designerIDPs)
// - rankDesigners(scoredDesigners)
// - getColdStartRecommendations()
//
// Entities used: IDPLike, IDP, IDPCategory, UserAccount, DesignerVerification, CompanyInformation
//
// Attributes: none
