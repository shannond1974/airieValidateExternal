import { HttpHeaders, HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ApiService } from '../rest/api.service';
import { ChangeDetectorRef, Component, OnInit, Input,Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-report',
  templateUrl: './app.report.html'
})
export class Report implements OnInit {

  @Input() answerSetId: number = 0;
  @Input() userName: string = '';
  @Input() firstName: string = '';
  public uiStage:number=0;
  public proceedButtonText:string="Apply Fields";
  public customerAge:number=0;
  public customerCitizenship:string='';

  public answersLoaded:boolean=false;
  public reportLoaded:boolean=false;
  public informationLoaded:boolean=false;
  public responseCount:number=0;

  public reportParts:string[]=[];

  
  public answers:AnswerList[]=[];
  public infoContent:informationContent[]=[];
  public conditionalLogic:ConditionalLogic[]=[];

  
  public emailSent:string='';
  public emailToSend:string='shannond1974@gmail.com';
  public emailToSend2:string='garrik.perry@gmail.com';
public merged:boolean=false;

  constructor(private http: HttpClient,private apiService: ApiService){
    this.answers=[];
    
  }
  checkResponse(){
    if(this.responseCount>2){
      this.moveStage(true);
    }
  }  
  
  ngOnInit() {
        console.log(this.answerSetId);
        const options = {
            'responseType': 'text'
          }
        
        let reportId:number=2;

        // get the report sections
        this.apiService.getReportContent(reportId).subscribe(data => {
            for(let i=0;i<data.length;i++){
              this.reportParts.push(data[i].sectionContent);
            }
            this.responseCount++;
            this.checkResponse();
          })

        // get conditonal logic
        this.apiService.getConditionalLogic(reportId).subscribe(data => {
          for(let i=0;i<data.length;i++){
            this.conditionalLogic.push(data[i]);
          }
          this.responseCount++;
          this.checkResponse();
        })
          
        // get the answers
        this.apiService.getReportAnswers(this.answerSetId).subscribe(data => {
          for(let i=0;i<data.length;i++){
            
            // special variables to check for
            if(data[i].question=='Enter your date of birth'){
              this.customerAge=this.calculateAge(new Date(data[i].answerText));
            }
            if(data[i].question=='What country is your passport from?'){
              this.customerCitizenship=data[i].answerText;
            }
            
            this.answers.push(data[i]);

          }
          this.responseCount++;
          this.checkResponse();
        })
        
        // get the information content
        this.apiService.getInformationContent(reportId).subscribe(data => {
          for(let i=0;i<data.length;i++){
            this.infoContent.push(data[i]);
          }
          this.responseCount++;
            this.checkResponse();
        })
         
    }

    
    

    moveStage(isUp:boolean){
      console.log(this.reportParts.length);
      for(let i=0;i<this.reportParts.length;i++){
        this.reportParts[i]=this.reportParts[i].replace('[[CustomerName]]',this.firstName);
        this.reportParts[i]=this.reportParts[i].replace('[[PreparedFor]]',this.userName);
        this.reportParts[i]=this.reportParts[i].replace('[[DatePrepared]]',String(new Date()));
        this.reportParts[i]=this.reportParts[i].replace('[[Citizenship]]',this.customerCitizenship);
        this.reportParts[i]=this.reportParts[i].replace('[[PreparedFor]]',this.userName);
        this.reportParts[i]=this.reportParts[i].replace('[[DatePrepared]]',String(new Date()));
        this.reportParts[i]=this.reportParts[i].replace('[[VisaType]]','Fee Paying Student Visa');
        if(this.answers.length>0){
          for(let a=0;a<this.answers.length;a++){
            this.reportParts[i]=this.reportParts[i].replace(this.answers[a].mergeField,this.answers[a].answerText);
          }
        }
        if(this.infoContent.length>0){
          console.log(this.infoContent);
          for(let c=0;c<this.infoContent.length;c++){
            console.log(this.infoContent[c].mergeField);
            if(this.infoContent[c].mergeField=='[[Insurance]]'){
              console.log(this.infoContent[c].informationContent);
            }
            this.reportParts[i]=this.reportParts[i].replace(this.infoContent[c].mergeField,this.infoContent[c].informationContent);
          }
        }
        if(this.conditionalLogic.length>0){
          for(let c=0;c<this.conditionalLogic.length;c++){
            if (this.checkForAge(this.conditionalLogic[c].conditionalReportLogic)){
              // check for age
              if(this.evaluateCondtionAge(this.conditionalLogic[c].conditionalReportLogic,this.customerAge)=='true'){
                this.reportParts[i]=this.reportParts[i].replace(this.conditionalLogic[c].mergeField,this.conditionalLogic[c].informationContent);                
              }else{
                this.reportParts[i]=this.reportParts[i].replace(this.conditionalLogic[c].mergeField,'');
              }
            }
          
            if (this.checkForAnswer(this.conditionalLogic[c].conditionalReportLogic)){
              // check for answer
              for(let a=0;a<this.answers.length;a++){
                // need to get the specific question we're after
                if(this.answers[a].question==this.conditionalLogic[c].questionText){
                  if(this.evaluateAnswerHas(this.conditionalLogic[c].conditionalReportLogic,this.answers[a].answerText)=='true'){
                    
                    this.conditionalLogic[c].informationContent;
                    this.conditionalLogic[c].mergeField;
                    this.reportParts[i]=this.reportParts[i].replace(this.conditionalLogic[c].mergeField,this.conditionalLogic[c].informationContent);                
                  }else{
                    
                    this.reportParts[i]=this.reportParts[i].replace(this.conditionalLogic[c].mergeField,'');
                  }
                }
                  
              }
            }
          }
        }
      }
      
      this.merged=true;
    }

    checkForAnswer(logic:string){
      if(logic.includes('if [answer] has')){
        return true;
      }else{
        return false;
      }
    }

    // general helper functions - TO DO, move these into a service
    checkForAge(logic:string){
      if(logic.includes('if [age]')){
        return true;
      }else{
        return false;
      }
    }

    evaluateAnswerHas(logic:string,answerText:string){
     
      let result:string='null';
      if(logic.includes('if [answer] has')){
        // checking for answer
        
        let answerCheck:string='';
        
        if (logic.includes(answerText)){
              result='true';
            }else{  
              result='false';
            }
       
      }
      return result;
    }

    evaluateCondtionAge(logic:string,age:number){
     
      let result:string='null';
      if(logic.includes('if [age]')){
        // checking for age
        let ageCheck:number=0;
        if (logic.includes('<')){
            // check if it's grater than the age
            ageCheck=Number(logic.split('<')[1]);
            if(age<ageCheck){
              result='true';
            }else{  
              result='false';
            }
        }else
        {

        }
      }
      return result;
    }

    
    calculateAge(dob:Date) {
      // Convert the date of birth to a Date object
      let birthDate = new Date(dob);
      let today = new Date();
  
      // Calculate the difference in years
      let age = today.getFullYear() - birthDate.getFullYear();
  
      // Adjust the age if the birth date hasn't occurred yet this year
      let monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
  
      return age;
    }




}

interface AnswerList {
  answerText: string;
  question:string;
  mergeField: string;
  userName: string;
  
  }
  
  interface ConditionalLogic{
    conditionalReportId:number;
    reportId:number;
    mergeField: string;
    trueAction:string;
    falseAction:string;
    sectionContent:string;
    informationContent:string;
    conditionalReportLogic:string;
    questionId:number;
    questionText:string;
  }

  interface informationContent{
    mergeField: string;
    informationContent:string;
  }

  interface Email{
    email:string;
    internalEmail:boolean;
    AnswerSetId:number;
  }


