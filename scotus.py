import pandas as pd 
import numpy as np
import os
import json 

#origdata = pd.read_csv("SCDB_2016_01_justiceCentered_Vote.csv", sep=",")
origdata = pd.read_csv("SCOTUSPartyTagged.csv", sep = ',')  #tagged with justice info 
def main():	
	years = range(1946,2016) 
	# #years = range(1946,2016,2) #2 years grouped
	# years = range(1946,2016,3) #2 years grouped
	# years = range(1946,2016,5) #2 years grouped
	vote_history = []
	keep = []  #indicator for if last value of docket id is 1
	voteid = []
	for i in range(len(origdata['docketId'])):
		docket_id_list = origdata['docketId'][i].split("-")
		vote_id_list = origdata['voteId'][i].split("-")
		del vote_id_list[-1]  #last id is justice id, 2nd to last is the vote issue within the case issue 
		newvoteid = "-".join(vote_id_list)  
		voteid.append(newvoteid)
		if (docket_id_list[len(docket_id_list)-1] == '01'):
			if (not np.isnan(origdata["vote"][i])):
				#make sure that they voted
				keep.append(1)
			else:
				keep.append(0)
		else:
			keep.append(0)
	origdata["keep"] = keep  #append colm to df
	origdata["newvoteid"] = newvoteid

	data = origdata.loc[origdata['keep'] == 1]  #data with only docket 01

	for year in years:
		vote_record = {}  #dictionary of history 
		#get only docket ids that end with 01 to minimize consolidation and reduce size of data
		justices_voted = []  #keep track of which justice voted 
		justices = data.loc[(data["term"] == year)]["justice"]  #one year
		#justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1))]["justice"]  #select just the justices in that year 
		#justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2))]["justice"]  #select just the justices in that year 
		# justices = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2)) | (data["term"] == (year + 3)) | (data["term"] == (year + 4))]["justice"]  #select just the justices in that year 
		justicelist = list(set(justices))  #unique list of justices 
		justicelist.sort()  #put justice id numbers in increasing order
		#casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		casesissues = data.loc[data["term"] == year]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		#casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		# casesissues = data.loc[(data["term"] == year) | (data["term"] == (year + 1)) | (data["term"] == (year + 2)) | (data["term"] == (year + 3)) | (data["term"] == (year + 4))]["caseIssuesId"]  #b/c some casesissues have multiple issues to be voted on
		caselist = list(set(casesissues))
		caselist.sort()
		J_first_colm = []
		J_second_colm = []
		J_pair = []   #concatenated justice IDs 
		same_vote = []  #number of times voted together
		majority_count = [] #number of times pair voted with majority 
		dissent_count = [] #number of times pair voted with majority 
		#make matrix of every combination of justices for each year --4 columns,ID of justice pair, justice 1, J2, number of times voted together
		for i in range(len(justicelist)):
			J1 = justicelist[i]
			for j in range(len(justicelist)):
				if J1 < justicelist[j]:
					J_pair.append(str(J1) + "_" + str(justicelist[j]))
					J_first_colm.append(J1)
					J_second_colm.append(justicelist[j])
					same_vote.append(0)
					majority_count.append(0)
					dissent_count.append(0)
		#pull casesissues data and calculate number of times voted together
		for caseissue in caselist:
			#find the (2) groups of justices who voted a certain way 
			case_data = data.loc[data["caseIssuesId"] == caseissue]  #all data for an individual case
			#find vote ids 
			allvoteids = list(set(case_data["newvoteid"]))
			for casevoteid in allvoteids:
				casedatabyvoteid = case_data.loc[case_data["newvoteid"] == casevoteid]
				majority = list(set(casedatabyvoteid.loc[(case_data["vote"] <= 5) & (casedatabyvoteid["vote"] != 2)]["justice"]))  #justices who voted with majority, ie vote = 1, 3, 4 
				majority.sort()  
				dissent = list(set(casedatabyvoteid.loc[((case_data["vote"] == 2) | (casedatabyvoteid["vote"] == 6) | (casedatabyvoteid["vote"] == 7))]["justice"]))
				dissent.sort()
				#track if leaned liberal or conservative
				justices_on_case = list(set(case_data["justice"]))   #unique list of justices on a case 
				same_vote = vote_counter(majority, same_vote, J_pair)  #tally pairs of those who voted together 
				same_vote = vote_counter(dissent, same_vote, J_pair)
				#data quality check on majority votes
		vote_record.update({"Year": year, "id": J_pair ,"J1": J_first_colm, "J2" : J_second_colm, "Vote": same_vote})
		vote_history.append(vote_record)   #array of dictionaries 
	
	#encode to json 
	#jdata = json.dumps(vote_history)
	with open('votedataG1.txt', 'w') as outfile:
	    json.dump(vote_history, outfile)
	os.system('say "DunDunDun Donnne"')

	#***track freq of justices who voted on majority vs. dissent vs split 
	#of those who voted together 

	#tag justices based on who appointed them
	
	#check and see if justices voted on a case 

	#go by direction first? if vote liberal, 

#create array of dictionaries 

def vote_counter(voting_group, same_vote, J_pair):
	for i in range(len(voting_group)):
		J1 = voting_group[i]
		for j in range(len(voting_group)):
			if J1 < voting_group[j]:
				#count = same_vote[J_pair.index(str(J1) + "_" + str(majority[j]))]
				voted_together_index = J_pair.index(str(J1) + "_" + str(voting_group[j]))
				#print J_pair[voted_together_index]
				same_vote[voted_together_index] += 1  #number of times pairs of justices voted together
	return same_vote

if __name__ == '__main__':
	main()
