###prepare cleaned json data1 from python for D3 
#merge with justice info 
setwd("~/Documents/UNC/SCOTUS-NLP/law-net")
library(jsonlite)
library(tidyjson)
library(rjson)
library(igraph)

J_party_final = read.csv(file = "Justicedata.csv")  #justices and the party they're assoc with 
data1 = fromJSON(file = "votedataG1_byissue.txt")
issues = read.csv(file = "IssueKeyLookup.csv")  #use to merge issue numbers with issue topic
fulldata = {}
for (i in 1:length(data1)){  
  #i = one year 
  #j = # combos of judge pairings
  matrix1 = {}
  for (j in 1:length(data1[[i]]$IssueAgreement)){
    #k = # of issues discussed 
    print(i)
    for (k in 1:length(data1[[i]]$IssueAgreement[[j]])){
      #repeat J1, J2, vote data1 down for each case issue and bind with case issue/topic level data1
      rowdata1 = cbind(data1[[i]]$J1[j], data1[[i]]$J2[j], data1[[i]]$Vote[j], data1[[i]]$Coworkers[j], data1[[i]]$IssueAgreement[[j]][k], data1[[i]]$Coworkers_Issue[[j]][k], k, data1[[i]]$Year)
      matrix1 = rbind(matrix1, rowdata1)        
    }    
  }
  #Case_Opps, Total_Freq = total opps/freq for that issue, analogous to all issues--matching names for easier d3
  colnames(matrix1) = c("J1","J2", "AllIssues_Total_Freq", "AllIssues_Case_Opps", "Total_Freq", "Case_Opps", "issueArea", "Year")
  m11 = merge(matrix1, J_party_final, by.x = "J1", by.y = "justice")  #merge justice info for 1st justice
  m21 = merge(m11, J_party_final, by.x = "J2", by.y = "justice")  #merge 2nd justice info
  colnames(m21)[9:12] = c("J1name", "J1Prez", "J1PrezParty", "J1party")
  colnames(m21)[13:16] = c("J2name", "J2Prez", "J2PrezParty", "J2party")
  m21["J_id"] = paste(m21[['J1']], m21[['J2']], sep ="_") #justice pair id 
  fulldata = rbind(fulldata, m21)
}


##merge group results from network community detection into data 
#merge with subset of d3full on J_id 
d3full["YearJ_ID"] = paste(d3full[["J_id"]],d3full[["Year"]], sep="_")
fulldata["YearJ_ID"] = paste(fulldata[["J_id"]],fulldata[["Year"]], sep="_")
Jgroups = cbind(d3full["J_id"],d3full["G1"], d3full["G2"],d3full["YearJ_ID"])

final = merge(fulldata, Jgroups, by.x = "YearJ_ID", by.y = "YearJ_ID")
dim(final)
write.csv(final, "D3Data_byIssue.csv")
d = read.csv("D3Data_byIssue.csv")
d["ColorValue"] = rep(0,dim(d)[1])
dems = intersect(which(d["J1PrezParty"] == "D"),which(d["J2PrezParty"] == "D"))
repubs = intersect(which(d["J1PrezParty"] == "R"),which(d["J2PrezParty"] == "R"))
d[dems, "ColorValue"] = 1
d[repubs, "ColorValue"] = -1
finalfinal = merge(d,issues, by.x = "issueArea", by.y = "Value")
write.csv(finalfinal, file="D3_ByIssueFinal.csv")
