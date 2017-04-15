#exploratory data analysis -- see what make up of the court has been
setwd("~/Documents/UNC/SCOTUS-NLP/law-net")
library(jsonlite)
library(tidyjson)
library(rjson)
library(igraph)
library(stringr)
db = read.csv(file = "SCOTUSPartyTagged_final.csv")

#number of case issues voted on halved starting in 90s-why
hist(as.numeric(unlist(db["term"])))  
sanitycheck = function(data, year){
  dyear = data[data["term"] == year,]
  keep = rep(0,dim(dyear)[1])
  for (i in 1:dim(dyear)[1]){
    caseid = str_sub(dyear[i,"docketId"], -2)
    if(caseid == "01"){
      keep[i] = 1    
    }
  }
  dkeep = dyear[which(keep == 1),]
  print (unique(dkeep["justice"]))
  #return (keep)
  return (dkeep)
}

sanitycheck2_freq = function(db, SCJ1, SCJ2){
  J1 = db[which(db["justice"] == SCJ1),]
  J2 = db[which(db["justice"] == SCJ2),]    
  ##number of times justices agreed
  #intersect -- need to be less than 4 and also not equal to 2
  J1A = J1[intersect(which(J1["vote"] <= 4),which(J1["vote"] != 2)),"caseIssuesId"]
  J2A = J2[intersect(which(J2["vote"] <= 4),which(J2["vote"] != 2)),"caseIssuesId"]  
  agreement_freq = length(intersect(J1A,J2A))
  #number agree in disagreement 
  J1D = J1[c(which(J1["vote"] == 6),which(J1["vote"] == 7),which(J1["vote"] == 2)),"caseIssuesId"]
  J2D = J2[c(which(J2["vote"] == 6),which(J1["vote"] == 7),which(J2["vote"] == 2)),"caseIssuesId"]  
  disagree_freq = length(intersect(J1D,J2D))
  concur = agreement_freq + disagree_freq
  #results = list("J1_cases" = J1A, "J2_cases" = J2A, "Freq" = concur)
  #return (results)
  return (concur)
}
db1 = sanitycheck(db, 1988)  #find justices assoc w/that year and subset of data for that year 
#check see how many times they voted affirmative on same case
#should match python matrix -1988: 100, 102: 110; 
#1995: 105,110: 76; 2005: 111, 112: 40; 103,105:60 - PYTHON HAS 59 WTF encoding error in data
wtf = sanitycheck2_freq(db1, 100,102)  
db2 = sanitycheck(db, 2005)
wtf1 = sanitycheck2_freq(db2, 112,111)  
db3 = sanitycheck(db, 1995)
sanitycheck2_freq(db3, 103,105)  
db3 = sanitycheck(db, 1995)
sanitycheck2_freq(db3, 109,110)  

length(wtf2$J2_cases)
length(wtf2$J1_cases)
######how many R/D per case over time 

data = fromJSON(file = "Court_Composition.txt")  #each individual year
data = fromJSON(file = "Court_CompositionG2.txt")  #each individual year
data = fromJSON(file = "Court_CompositionG3.txt")  #each individual year
Dcount = rep(0,length(data))
Rcount = rep(0,length(data))
count = {}  #number of justices on each case
over9 = {}
over9case = {}
for (i in 1:length(data)){
  count = c(count,data[[i]]$D)
  if(length(which(data[[i]]$D > 9)) > 0){
    over9 = c(over9, data[[i]]$Year)  
    over9case = c(over9case, data[[i]]$CaseIssue[which(data[[i]]$D > 9)])  
  }
  Dcount[i] = median(data[[i]]$D)
  Rcount[i] = median(data[[i]]$R)
}
DTS = ts(Dcount, start = 1946)
RTS = ts(Rcount, start = 1946)
plot.ts(DTS)
#lines(RTS, lty = 2)
length(c(which(Dcount < 3),which(Dcount > 7)))  #42/70 for G1
length(c(which(Dcount < 3),which(Dcount > 7)))  #21/35 for G2
length(c(which(Dcount < 3),which(Dcount > 7)))  #14/23 for G3
hist(Dcount)
plot(ecdf(count))  #indiv cases, median = 3
