import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet,ActivatedRoute  } from '@angular/router';
import { Landing } from './UIComponents/app.landing';
import { ApiService} from './rest/api.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'airie';
  public proceedButtonText:string="Pick a Visa Type!";
  public iCount:number=0;
  // use this variable to determine where we are in the workflow.
  public uiStage:number=10;
  public userName:string='';
  public passWord:string='';
  public invalidPassword:boolean=false;
  public hasParam=false;
  public answerSet:string='';
  public answerSetId:number=0;  
  public firstName:string='';

  constructor(private route: ActivatedRoute,private http: HttpClient,private apiService: ApiService) {

  }

  ngOnInit() {
    this.userName=='airie';
    
    this.route.queryParams.subscribe(params => {
      const answerSetGet = params['AnswerSet'];
      this.answerSet=answerSetGet;
      console.log(answerSetGet);
      this.apiService.getSubmittedAnswers().subscribe(data => {
        console.log(data);
        for(var i = 0; i < data.length; i++){
          if(this.answerSet.toLowerCase()==data[i].uniqueLink.toLowerCase()){
            
            this.answerSetId=data[i].answerSetId;
            this.firstName=data[i].firstName;
            this.userName=data[i].userName;
            this.hasParam=true;
            console.log('here 2'); 
          }
          
        }
        
      })
      
    });
    
  }

  moveStageCustom(moveTo:number){
    // progress the stage to the next step
    this.uiStage=moveTo;
    
  }
  login(){
    if(this.passWord=='Airie2024!Migrate' && this.userName=='airie'){
      this.invalidPassword=false;
      this.uiStage=10;
    }else{
      this.invalidPassword=true;
    }

  }

  moveStage(isUp:boolean){
    // progress the stage to the next step
    if(isUp){
      this.uiStage++;
    }else{
      // or go back to the previous stage
      this.uiStage--;
    }
    if(this.uiStage<2){
      this.proceedButtonText="Pick a Visa Type!";
    }else{
      this.proceedButtonText="Get My Report!";
    }
  }
}
