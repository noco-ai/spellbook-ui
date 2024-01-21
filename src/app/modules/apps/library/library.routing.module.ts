import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LibraryTabs } from "./component/tabs.component";
import { FictionComponent } from "./component/fiction/fiction.component";
import { BookComponent } from "./component/book/book.component";
import { BookAnalysisComponent } from "./component/analysis/analysis.component";
import { BookLocationsComponent } from "./component/locations/locations.component";
import { BookCharactersComponent } from "./component/characters/characters.component";
import { LibraryNonfictionComponent } from "./component/non-fiction/non-fiction.component";
import { BookQaComponent } from "./component/qa/qa.component";
import { BookSummaryComponent } from "./component/summary/summary.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: "",
        component: LibraryTabs,
        children: [
          { path: "", redirectTo: "fiction", pathMatch: "full" },
          { path: "fiction", component: FictionComponent },
          { path: "non-fiction", component: LibraryNonfictionComponent },
          { path: "book/:id", component: BookComponent },
          { path: "qa/:id", component: BookQaComponent },
          { path: "characters/:id", component: BookCharactersComponent },
          { path: "summary/:id", component: BookSummaryComponent },
          { path: "analyze/:id", component: BookAnalysisComponent },
          { path: "locations/:id", component: BookLocationsComponent },
        ],
      },
    ]),
  ],
  exports: [RouterModule],
})
export class LibraryRoutingModule {}
