import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import LabellingConcept from "./concepts/labelling";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import SortingConcept from "./concepts/sorting";
import SourcingConcept from "./concepts/sourcing";
import TemplatingConcept from "./concepts/templating";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const Sourcing = new SourcingConcept("sources");
export const Labelling = new LabellingConcept("labels");
export const Templating = new TemplatingConcept("templates");
export const Sorting = new SortingConcept("sorts");
