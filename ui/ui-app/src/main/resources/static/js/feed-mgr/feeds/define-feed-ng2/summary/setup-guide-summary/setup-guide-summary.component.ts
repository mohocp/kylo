import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {StateService} from "@uirouter/angular";
import {DefineFeedService, FeedEditStateChangeEvent} from "../../services/define-feed.service";
import {AbstractLoadFeedComponent} from "../../shared/AbstractLoadFeedComponent";
import {FeedLoadingService} from "../../services/feed-loading-service";
import {Step} from '../../../../model/feed/feed-step.model';
import {FeedSideNavService} from "../../services/feed-side-nav.service";
import {FeedLineageComponment} from "../feed-lineage/feed-lineage.componment";
import {SaveFeedResponse} from "../../model/save-feed-response.model";
import {ISubscription} from "rxjs/Subscription";
import {SETUP_GUIDE_LINK} from "../../model/feed-link-constants";
import {Feed, FeedMode, LoadMode} from "../../../../model/feed/feed.model";
import {FEED_DEFINITION_SECTION_STATE_NAME, FEED_DEFINITION_SUMMARY_STATE_NAME} from "../../../../model/feed/feed-constants";
import {NewFeedDialogComponent, NewFeedDialogData, NewFeedDialogResponse} from "../../new-feed-dialog/new-feed-dialog.component";
import {TdDialogService} from "@covalent/core/dialogs";
import {KyloIcons} from "../../../../../kylo-utils/kylo-icons";
import {EntityVersion} from "../../../../model/entity-version.model";
import {RestResponseStatus, RestResponseStatusType} from "../../../../../common/common.model";


@Component({
    selector: "setup-guide-summary",
    styleUrls: ["js/feed-mgr/feeds/define-feed-ng2/summary/setup-guide-summary/setup-guide-summary.component.scss"],
    templateUrl: "js/feed-mgr/feeds/define-feed-ng2/summary/setup-guide-summary/setup-guide-summary.component.html"
})
export class SetupGuideSummaryComponent extends AbstractLoadFeedComponent  {

    static LOADER = "SetupGuideContainerComponent.LOADER";

    static LINK_NAME = SETUP_GUIDE_LINK;

    @Input() stateParams: any;

    @Input()
    showHeader:boolean

    feedSavedSubscription:ISubscription;

    showEditLink:boolean;

    kyloIcons = KyloIcons;

    getLinkName(){
        return SetupGuideSummaryComponent.LINK_NAME;
    }

    constructor(feedLoadingService: FeedLoadingService, stateService: StateService, defineFeedService: DefineFeedService, feedSideNavService:FeedSideNavService, private _dialogService:TdDialogService) {
        super(feedLoadingService, stateService, defineFeedService, feedSideNavService);
       this.feedSavedSubscription = this.defineFeedService.subscribeToFeedSaveEvent(this.onFeedSaved.bind(this))
     }

    init(){
        if(this.feed.isDraft()){
            this.showEditLink = this.feed.canEdit() && this.feed.readonly;
        }
        else{
            //ensure there is not another draft version
            let draft = this.defineFeedService.draftVersionExists(this.feed.id).subscribe((exists:string) => {
                if(exists && exists == "true") {
                 this.showEditLink = false;
                 this.feed.mode = FeedMode.DEPLDYED_WITH_ACTIVE_DRAFT;
                }
                else {
                    this.feed.mode = FeedMode.DEPLOYED;
                    this.showEditLink = this.feed.canEdit() && this.feed.readonly
                }
            },error1 => {
                console.log("Error checking for draft ",error1)
                this.showEditLink = this.feed.canEdit() && this.feed.readonly;
            })
        }
    }

    destroy(){
        this.feedSavedSubscription.unsubscribe();
    }

    /**
     * Load the latest version for this feed.
     * This will be called only when viewing the deployed version to take the user back to the draft version data
     * @param {MouseEvent} $event
     */
    loadDraftVersion($event:MouseEvent){
        $event.stopPropagation();
        $event.preventDefault();
        this.defineFeedService.loadDraftFeed(this.feed.id).subscribe((feed:Feed) => {
            this.stateService.go(FEED_DEFINITION_SECTION_STATE_NAME+".setup-guide",{feedId:this.feed.id, loadMode:LoadMode.LATEST},{reload:false});
        });
    }

    loadDeployedVersion($event:MouseEvent){
        $event.stopPropagation();
        $event.preventDefault();
        this.defineFeedService.loadDeployedFeed(this.feed.id).subscribe((feed:Feed) => {
            this.stateService.go(FEED_DEFINITION_SECTION_STATE_NAME+".setup-guide",{feedId:this.feed.id, loadMode:LoadMode.DEPLOYED},{reload:false});
        });
    }

    deployFeed(){
        this.defineFeedService.deployFeed(this.feed).subscribe((response:any) =>{
            if(response){
               let  redirectState = FEED_DEFINITION_SUMMARY_STATE_NAME+".feed-activity";
                this.stateService.go(redirectState,{feedId:this.feed.id,refresh:true}, {location:'replace'})
            }
        })
    }

    onFeedSaved(response:SaveFeedResponse){
        if(response.success){
            //update this feed
            this.feed = response.feed;
            console.log('Feed saved overview component ',this.feed)
        }
    }

    onEdit(){
        this.defineFeedService.markFeedAsEditable();
        //redirect to setup guide
        this.stateService.go(FEED_DEFINITION_SECTION_STATE_NAME+".setup-guide",{feedId:this.feed.id})
    }

    onCancelEdit(){
        this.feed.readonly = true;
        this.defineFeedService.markFeedAsReadonly();

    }

    onDelete(){
        //confirm then delete
        this.defineFeedService.deleteFeed();
    }

    cloneFeed(){
        this.defineFeedService.cloneFeed(this.feed);
    }

    revertDraft(){
        this.defineFeedService.revertDraft(this.feed);
    }

    onFeedEditStateChange(event:FeedEditStateChangeEvent){
        super.onFeedEditStateChange(event);
        this.init();
    }



}